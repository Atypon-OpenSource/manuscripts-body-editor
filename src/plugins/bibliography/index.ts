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
  createBibliographyElementContents,
} from '@manuscripts/library'
import { generateID } from '@manuscripts/manuscript-transform'
import { ObjectTypes } from '@manuscripts/manuscripts-json-schema'
import { isEqual } from 'lodash-es'
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state'
import { DecorationSet } from 'prosemirror-view'

import {
  buildDecorations,
  getBibliographyItemFn,
  isBibliographyElement,
} from './bibliography-utils'
import { BibliographyProps, PluginState } from './types'

export const bibliographyKey = new PluginKey('bibliography')

/**
 * This plugin generates labels for inline citations and the bibliography contents, using citeproc-js.
 * The citation labels and bibliography are regenerated when any relevant content changes.
 */
export default (props: BibliographyProps) => {
  const getBibliographyItem = getBibliographyItemFn(props)

  return new Plugin<PluginState>({
    key: bibliographyKey,
    state: {
      init(config, instance): PluginState {
        const citationNodes = buildCitationNodes(instance.doc, props.getModel)

        const citations = buildCitations(citationNodes, (id: string) =>
          getBibliographyItem(id)
        )

        return {
          citationNodes,
          citations,
        }
      },

      apply(tr, value, oldState, newState): PluginState {
        const citationNodes = buildCitationNodes(newState.doc, props.getModel)

        const citations = buildCitations(citationNodes, (id: string) =>
          getBibliographyItem(id)
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

      const bibliographyInserted = transactions.some((tr) => {
        const meta = tr.getMeta(bibliographyKey)
        return meta && meta.bibliographyInserted
      })
      // This equality is trigged by such things as the addition of createdAt, updatedAt,
      // sessionID, _rev when the models are simply persisted to the PouchDB without modifications
      if (isEqual(citations, oldCitations) && !bibliographyInserted) {
        return null
      }
      const { tr } = newState
      const { selection } = tr

      try {
        const generatedCitations = citationProvider
          .rebuildProcessorState(citations, 'html')
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

              const contentsElement = createBibliographyElementContents(
                generatedBibliographyItems,
                id,
                node.attrs.placeholder
              )

              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                contents: contentsElement.outerHTML,
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
        tr.setMeta('origin', bibliographyKey)
        return tr
      } catch (error) {
        console.error(error) // tslint:disable-line:no-console
      }
    },
    props: {
      decorations(state) {
        const pluginState = this.getState(state)
        if (pluginState) {
          const { citationNodes } = pluginState
          return DecorationSet.create(
            state.doc,
            buildDecorations(state.doc, citationNodes, getBibliographyItem)
          )
        }
      },
    },
  })
}
