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
  CitationNode,
  generateID,
  isCitationNode,
  ManuscriptEditorState,
  ManuscriptNode,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Citation,
  CitationItem,
  Manuscript,
  Model,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'
import CiteProc from 'citeproc'
import { isEqual } from 'lodash-es'
import {
  NodeSelection,
  Plugin,
  PluginKey,
  Transaction,
} from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { bibliographyElementContents } from '../lib/bibliography'

type CitationNodes = Array<[CitationNode, number, Citation]>

type DisplayScheme = 'show-all' | 'author-only' | 'suppress-author'

interface PluginState {
  citationNodes: CitationNodes
  citations: CiteProc.Citation[]
}

export const bibliographyKey = new PluginKey('bibliography')

const bibliographyInserted = (transactions: Transaction[]): boolean =>
  transactions.some(tr => {
    const meta = tr.getMeta(bibliographyKey)
    return meta && meta.bibliographyInserted
  })

const isBibliographyElement = (node: ManuscriptNode) =>
  node.type === node.type.schema.nodes.bibliography_element

interface Props {
  getCitationProcessor: () => CiteProc.Engine | undefined
  getLibraryItem: (id: string) => BibliographyItem | undefined
  getModel: <T extends Model>(id: string) => T | undefined
  getManuscript: () => Manuscript
}

export default (props: Props) => {
  const buildCitationNodes = (state: ManuscriptEditorState): CitationNodes => {
    const citationNodes: CitationNodes = []

    state.doc.descendants((node, pos) => {
      if (isCitationNode(node)) {
        const citation = props.getModel<Citation>(node.attrs.rid)

        if (citation) {
          citationNodes.push([node, pos, citation])
        }
      }
    })

    return citationNodes
  }

  const chooseMode = (displayScheme?: DisplayScheme) => {
    if (displayScheme === 'show-all') {
      return undefined
    }

    return displayScheme
  }

  const buildCitations = (citationNodes: CitationNodes): CiteProc.Citation[] =>
    citationNodes.map(([node, pos, citation]) => ({
      citationID: citation._id,
      citationItems: citation.embeddedCitationItems.map(
        (citationItem: CitationItem) => ({
          id: citationItem.bibliographyItem,
          data: props.getLibraryItem(citationItem.bibliographyItem), // for comparison
        })
      ),
      properties: {
        noteIndex: 0,
        mode: chooseMode(citation.displayScheme),
      },
      manuscript: props.getManuscript(), // for comparison
    }))

  const buildDecorations = (
    doc: ManuscriptNode,
    citationNodes: CitationNodes
  ) => {
    const decorations: Array<Decoration<{ missing: true }>> = []

    let hasMissingItems = false

    for (const [node, pos, citation] of citationNodes) {
      if (citation.embeddedCitationItems.length) {
        for (const citationItem of citation.embeddedCitationItems) {
          if (!props.getLibraryItem(citationItem.bibliographyItem)) {
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
      decorations: state => {
        const { citationNodes } = bibliographyKey.getState(state)

        return DecorationSet.create<ManuscriptSchema>(
          state.doc,
          buildDecorations(state.doc, citationNodes)
        )
      },
    },
    state: {
      init(config, instance): PluginState {
        const citationNodes = buildCitationNodes(instance)
        const citations = buildCitations(citationNodes)

        return {
          citationNodes,
          citations,
        }
      },

      apply(tr, value, oldState, newState): PluginState {
        const citationNodes = buildCitationNodes(newState)
        const citations = buildCitations(citationNodes)

        return {
          citationNodes,
          citations,
        }
      },
    },

    appendTransaction(transactions, oldState, newState) {
      const citationProcessor = props.getCitationProcessor()

      if (!citationProcessor) {
        return null
      }

      // TODO: use setMeta to notify of updates when the doc hasn't changed?
      // if (!transactions.some(transaction => transaction.docChanged)) {
      //   return null
      // }

      const { citations: oldCitations } = bibliographyKey.getState(
        oldState
      ) as PluginState

      const { citationNodes, citations } = bibliographyKey.getState(
        newState
      ) as PluginState

      if (
        isEqual(citations, oldCitations) &&
        !bibliographyInserted(transactions)
      ) {
        return null
      }

      const { tr } = newState
      const { selection } = tr

      try {
        const generatedCitations = citationProcessor
          .rebuildProcessorState(citations)
          .map(item => item[2]) // id, noteIndex, output

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

        // generate the bibliography
        const bibliography = citationProcessor.makeBibliography()

        if (bibliography) {
          const [bibmeta, generatedBibliographyItems] = bibliography

          if (bibmeta.bibliography_errors.length) {
            console.error(bibmeta.bibliography_errors) // tslint:disable-line:no-console
          }

          tr.doc.descendants((node, pos) => {
            if (isBibliographyElement(node)) {
              const id =
                node.attrs.id || generateID(ObjectTypes.BibliographyElement)

              const contents = bibliographyElementContents(
                node,
                id,
                generatedBibliographyItems
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
