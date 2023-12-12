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
import { isEqual } from 'lodash-es'
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state'
import { DecorationSet } from 'prosemirror-view'

import { isRejectedInsert } from '../../lib/track-changes-utils'
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

        const filteredCitationNodes = citationNodes.filter(
          (node) => !isRejectedInsert(node[0])
        )

        const citations = buildCitations(
          filteredCitationNodes,
          (id: string) => referencesModelMap.get(id) as BibliographyItem
        )

        const bibliographyItems = buildBibliographyItems(
          filteredCitationNodes,
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

        const filteredCitationNodes = citationNodes.filter(
          (node) => !isRejectedInsert(node[0])
        )

        const citations = buildCitations(
          filteredCitationNodes,
          (id: string) => referencesModelMap.get(id) as BibliographyItem
        )

        const bibliographyItems = buildBibliographyItems(
          filteredCitationNodes,
          (id: string) => referencesModelMap.get(id) as BibliographyItem
        )

        const meta = tr.getMeta(bibliographyKey)
        const triggerUpdate = meta && meta.triggerUpdate

        // TODO: return the previous state if nothing has changed, to aid comparison?

        return {
          citationNodes,
          citations,
          bibliographyItems,
          triggerUpdate,
        }
      },
    },

    appendTransaction(transactions, oldState, newState) {
      const { citations: oldCitations } = bibliographyKey.getState(
        oldState
      ) as PluginState

      const { citations, bibliographyItems } = bibliographyKey.getState(
        newState
      ) as PluginState

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
        const generatedCitations = new Map(
          CitationProvider.rebuildProcessorState(
            citations,
            bibliographyItems,
            style || '',
            locale,
            'html'
          ).map((item) => [item[0], item[2]])
        ) // id, noteIndex, output
        props.setCiteprocCitations(generatedCitations)

        if (selection instanceof NodeSelection) {
          tr.setSelection(NodeSelection.create(tr.doc, selection.from))
        }
        tr.setMeta(bibliographyKey, {
          triggerUpdate: true,
        })
        tr.setMeta('origin', bibliographyKey)
        return tr
      } catch (error) {
        console.error(error) // tslint:disable-line:no-console
      }
    },
    props: {
      decorations(state) {
        const { citationNodes, triggerUpdate } = bibliographyKey.getState(state)
        return DecorationSet.create(
          state.doc,
          buildDecorations(
            state.doc,
            citationNodes,
            props.popper,
            getReferencesModelMap(state.doc),
            triggerUpdate
          )
        )
      },
    },
  })
}
