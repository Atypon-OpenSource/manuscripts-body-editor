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

import { BibliographyItem } from '@manuscripts/json-schema'
import {
  buildBibliographyItems,
  buildCitationNodes,
  buildCitations,
  CitationProvider,
} from '@manuscripts/library'
import { skipTracking } from '@manuscripts/track-changes-plugin'
import { isEqual } from 'lodash-es'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state'
import { DecorationSet, EditorView } from 'prosemirror-view'

import { buildDecorations, getReferencesModelMap } from './bibliography-utils'
import { BibliographyProps, PluginState } from './types'

export const bibliographyKey = new PluginKey('bibliography')

/**
 * This plugin generates labels for inline citations using citeproc-js.
 * The citation labels are regenerated when any relevant content changes.
 */
export default (props: BibliographyProps) => {
  const { style, locale } = props.cslProps

  return new Plugin<PluginState>({
    key: bibliographyKey,
    state: {
      init(config, instance): PluginState {
        const referencesModelMap = getReferencesModelMap(instance.doc)
        const citationNodes = buildCitationNodes(
          instance.doc,
          referencesModelMap
        )

        const citations = buildCitations(
          citationNodes,
          (id: string) => referencesModelMap.get(id) as BibliographyItem
        )

        const bibliographyItems = buildBibliographyItems(
          citationNodes,
          (id: string) => referencesModelMap.get(id) as BibliographyItem
        )

        return {
          citationNodes,
          citations,
          bibliographyItems,
        }
      },

      apply(tr, value, oldState, newState): PluginState {
        const referencesModelMap = getReferencesModelMap(newState.doc)
        const citationNodes = buildCitationNodes(
          newState.doc,
          referencesModelMap
        )

        const citations = buildCitations(
          citationNodes,
          (id: string) => referencesModelMap.get(id) as BibliographyItem
        )

        const bibliographyItems = buildBibliographyItems(
          citationNodes,
          (id: string) => referencesModelMap.get(id) as BibliographyItem
        )
        // TODO: return the previous state if nothing has changed, to aid comparison?

        return {
          citationNodes,
          citations,
          bibliographyItems,
        }
      },
    },

    appendTransaction(transactions, oldState, newState) {
      const { citations: oldCitations } = bibliographyKey.getState(
        oldState
      ) as PluginState

      const { citationNodes, citations, bibliographyItems } =
        bibliographyKey.getState(newState) as PluginState

      const bibliographyInserted = transactions.some((tr) => {
        const meta = tr.getMeta(bibliographyKey)
        return meta && meta.bibliographyInserted
      })

      const initCitations = transactions.some((tr) => {
        const meta = tr.getMeta(bibliographyKey)
        return meta && meta.initCitations
      })
      // This equality is trigged by such things as the addition of createdAt, updatedAt,
      // sessionID, _rev when the models are simply persisted to the PouchDB without modifications
      if (
        isEqual(citations, oldCitations) &&
        !bibliographyInserted &&
        !initCitations
      ) {
        return null
      }
      const { tr } = newState
      const { selection } = tr

      try {
        const generatedCitations = CitationProvider.rebuildProcessorState(
          citations,
          bibliographyItems,
          style || '',
          locale,
          'html'
        ).map((item) => item[2]) // id, noteIndex, output

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

        // create a new NodeSelection
        // as selection.map(tr.doc, tr.mapping) loses the NodeSelection
        if (selection instanceof NodeSelection) {
          tr.setSelection(NodeSelection.create(tr.doc, selection.from))
        }
        tr.setMeta('origin', bibliographyKey)
        skipTracking(tr)
        return tr
      } catch (error) {
        console.error(error) // tslint:disable-line:no-console
      }
    },
    props: {
      handleClickOn(
        view: EditorView,
        pos: number,
        node: ProsemirrorNode,
        nodePos: number,
        event: MouseEvent
      ) {
        const targetElement = event.target as HTMLElement
        if (
          node.type === node.type.schema.nodes.citation &&
          (targetElement.classList?.contains('track-changes-review') ||
            targetElement.closest('.track-changes-review'))
        ) {
          return true
        }
        return false
      },
      decorations(state) {
        const { citationNodes } = bibliographyKey.getState(state)
        return DecorationSet.create(
          state.doc,
          buildDecorations(
            state.doc,
            citationNodes,
            props.popper,
            getReferencesModelMap(state.doc)
          )
        )
      },
    },
  })
}
