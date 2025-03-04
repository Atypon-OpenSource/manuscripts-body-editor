/*!
 * © 2024 Atypon Systems LLC
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

import { EditorState, Plugin, PluginKey, Selection } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { getClosestMatch, getMatches } from './lib'

export type SearchReplacePluginState = {
  value: string
  matches: Array<{ from: number; to: number }>
  replaceValue: string
  active: boolean // if the plugin actively display matches
  activeAdvanced: boolean // enabling advanced view for search and replace
  currentMatch: number
  caseSensitive: boolean
  ignoreDiacritics: boolean
  highlightCurrent: boolean
}

export const searchReplaceKey = new PluginKey<SearchReplacePluginState>(
  'findReplace'
)

function buildPluginState(
  state: EditorState,
  oldData?: SearchReplacePluginState,
  newData?: Partial<SearchReplacePluginState>,
  selection?: Selection,
  pointerChanged?: boolean
) {
  // this is needed to allow components that update this plugin states to update it partially and not always the entire state
  const data: SearchReplacePluginState = {
    value: '',
    replaceValue: '',
    active: false,
    activeAdvanced: false,
    currentMatch: -1, // index of a currently selected match
    highlightCurrent: false,
    matches: [],
    caseSensitive: false,
    ignoreDiacritics: true,
    ...oldData,
    ...newData,
  }

  // creating a new set of matches if search value has changed and not falsy
  data.matches = getMatches(
    state.doc,
    data.value,
    data.caseSensitive,
    data.ignoreDiacritics
  )

  // if user changes pointer position - we drop previous index so if next time user move selection it will be recalculated against the new pointer
  if (pointerChanged && selection && data.matches.length) {
    data.currentMatch = getClosestMatch('right', selection, data.matches)
  }

  // pointer was changed not by the UI of Find & Search, stop highlight as some other component is managing the selection
  if (!newData && pointerChanged) {
    data.highlightCurrent = false
  }

  // setting new currentMatch if search value is updated
  if (
    selection &&
    newData?.value &&
    oldData?.value !== newData?.value &&
    data.matches.length
  ) {
    data.currentMatch = getClosestMatch('right', selection, data.matches)
  }
  return data
}

export default () => {
  return new Plugin<SearchReplacePluginState>({
    key: searchReplaceKey,
    state: {
      init(config, instance) {
        return buildPluginState(instance)
      },
      apply(tr, value, oldState, newState) {
        const $old = searchReplaceKey.getState(oldState)
        const selectionChanged = !!tr.getMeta('pointer') || tr.selectionSet
        if (!$old || tr.getMeta(searchReplaceKey) || selectionChanged) {
          return buildPluginState(
            newState,
            $old,
            tr.getMeta(searchReplaceKey),
            newState.selection,
            selectionChanged
          )
        }
        return $old
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = searchReplaceKey.getState(state)

        if (
          !pluginState ||
          !pluginState.value ||
          (!pluginState.active && !pluginState.activeAdvanced)
        ) {
          return DecorationSet.empty
        }
        const decorations: Decoration[] = []

        pluginState.matches.forEach(({ from, to }, i) => {
          let className = 'search-result'
          if (pluginState.highlightCurrent && pluginState.currentMatch === i) {
            className = className + ' search-result-selected'
          }
          decorations.push(
            Decoration.inline(from, to, {
              class: className,
            })
          )
        })

        return DecorationSet.create(state.doc, decorations)
      },
    },
    view() {
      return {
        update() {
          const element = document.querySelector(
            '.search-result.search-result-selected'
          )
          if (element) {
            // @TODO - there is an identical function scrollIntoView in article-editor, think about maybe unifying
            const rect = element.getBoundingClientRect()
            if (rect.bottom > window.innerHeight || rect.top < 150) {
              element.scrollIntoView()
            }
          }
        },
      }
    },
  })
}
