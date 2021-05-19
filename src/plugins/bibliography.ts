/*!
 * © 2019 Atypon Systems LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  buildCitationNodes,
  buildCitations,
  CitationNodes,
  CitationProvider,
  createBibliographyElementContents,
} from '@manuscripts/library'
import {
  generateID,
  ManuscriptNode,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Model,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'
import { isEqual } from 'lodash-es'
import {
  NodeSelection,
  Plugin,
  PluginKey,
  Transaction,
} from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

interface CiteProcCitation {
  citationItems: Array<{ id: string }>
  properties?: {
    noteIndex?: number
  }
}

interface PluginState {
  citationNodes: CitationNodes
  citations: CiteProcCitation[]
}

export const bibliographyKey = new PluginKey('bibliography')

const bibliographyInserted = (transactions: Transaction[]): boolean =>
  transactions.some((tr) => {
    const meta = tr.getMeta(bibliographyKey)
    return meta && meta.bibliographyInserted
  })

const isBibliographyElement = (node: ManuscriptNode) =>
  node.type === node.type.schema.nodes.bibliography_element

interface Props {
  getCitationProvider: () => CitationProvider | undefined
  getLibraryItem: (id: string) => BibliographyItem | undefined
  getModel: <T extends Model>(id: string) => T | undefined
}

/**
 * Since the library collection is only updated _after_ the models have been saved thus
 * the items not always being available, depending on how fast the page renders, as a
 * fallback the bibliography items are also retrieved from the modelsMap.
 */
function getBibliographyItem(props: Props, id: string) {
  const libraryItem = props.getLibraryItem(id)
  if (libraryItem) {
    return libraryItem
  }
  return props.getModel<BibliographyItem>(id)
}

/**
 * This plugin generates labels for inline citations and the bibliography contents, using citeproc-js.
 * The citation labels and bibliography are regenerated when any relevant content changes.
 */
export default (props: Props) => {
  const buildDecorations = (
    doc: ManuscriptNode,
    citationNodes: CitationNodes
  ) => {
    const decorations: Array<Decoration<{ missing: true }>> = []

    let hasMissingItems = false

    for (const [node, pos, citation] of citationNodes) {
      if (citation.embeddedCitationItems.length) {
        for (const citationItem of citation.embeddedCitationItems) {
          if (!getBibliographyItem(props, citationItem.bibliographyItem)) {
            decorations.push(
              Decoration.node(pos, pos + node.nodeSize, {
                class: 'citation-missing',
              })
            )

            hasMissingItems = true
          }
        }
      } else {
        decorations.push(
          Decoration.node(pos, pos + node.nodeSize, {
            class: 'citation-empty',
          })
        )
      }
    }

    if (hasMissingItems) {
      doc.descendants((node, pos) => {
        if (isBibliographyElement(node)) {
          decorations.push(
            Decoration.node(
              pos,
              pos + node.nodeSize,
              {},
              {
                missing: true,
              }
            )
          )

          decorations.push(
            Decoration.widget(pos, () => {
              const el = document.createElement('div')
              el.className = 'bibliography-missing'
              el.textContent = `The bibliography could not be generated, due to a missing library item.`
              return el
            })
          )
        }
      })
    }

    return decorations
  }

  return new Plugin<PluginState, ManuscriptSchema>({
    key: bibliographyKey,
    props: {
      decorations: (state) => {
        const { citationNodes } = bibliographyKey.getState(state)

        return DecorationSet.create<ManuscriptSchema>(
          state.doc,
          buildDecorations(state.doc, citationNodes)
        )
      },
    },
    state: {
      init(config, instance): PluginState {
        const citationNodes = buildCitationNodes(instance.doc, props.getModel)

        const citations = buildCitations(citationNodes, (id: string) =>
          getBibliographyItem(props, id)
        )

        return {
          citationNodes,
          citations,
        }
      },

      apply(tr, value, oldState, newState): PluginState {
        const citationNodes = buildCitationNodes(newState.doc, props.getModel)

        const citations = buildCitations(citationNodes, (id: string) =>
          getBibliographyItem(props, id)
        )
        // TODO: return the previous state if nothing has changed, to aid comparison?

        return {
          citationNodes,
          citations,
        }
      },
    },

    appendTransaction(transactions, oldState, newState) {
      const citationProvider = props.getCitationProvider()

      if (!citationProvider) {
        return null
      }

      const { citations: oldCitations } = bibliographyKey.getState(
        oldState
      ) as PluginState

      const { citationNodes, citations } = bibliographyKey.getState(
        newState
      ) as PluginState

      // This equality is trigged by such things as the addition of createdAt, updatedAt,
      // sessionID, _rev when the models are simply persisted to the PouchDB without modifications
      if (
        isEqual(citations, oldCitations) &&
        !bibliographyInserted(transactions)
      ) {
        return null
      }
      const { tr } = newState
      const { selection } = tr

      try {
        const generatedCitations = citationProvider
          .rebuildProcessorState(citations)
          .map((item) => item[2]) // id, noteIndex, output

        citationNodes.forEach(([node, pos], index) => {
          let contents = generatedCitations[index]

          if (contents === '[NO_PRINTED_FORM]') {
            contents = ''
          }

          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            contents,
          })
        })

        const bibliography = citationProvider.makeBibliography()
        if (bibliography) {
          const [bibmeta, generatedBibliographyItems] = bibliography

          if (bibmeta.bibliography_errors.length) {
            console.error(bibmeta.bibliography_errors) // tslint:disable-line:no-console
          }

          tr.doc.descendants((node, pos) => {
            if (isBibliographyElement(node)) {
              const id =
                node.attrs.id || generateID(ObjectTypes.BibliographyElement)

              const contents = createBibliographyElementContents(
                generatedBibliographyItems,
                id,
                node.attrs.placeholder
              )

              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                contents,
                id,
              })
            }
          })
        }

        // create a new NodeSelection
        // as selection.map(tr.doc, tr.mapping) loses the NodeSelection
        if (selection instanceof NodeSelection) {
          tr.setSelection(NodeSelection.create(tr.doc, selection.from))
        }

        return tr
      } catch (error) {
        console.error(error) // tslint:disable-line:no-console
      }
    },
  })
}
