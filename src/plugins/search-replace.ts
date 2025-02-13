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

import { Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { isDeleted, isDeletedText } from '../lib/track-changes-utils'

export type SearchReplacePluginState = {
  value: string
  matches: Array<{ from: number; to: number }>
  replaceValue: string
  active: boolean // if the plugin actively display matches
  activeAdvanced: boolean // enabling advanced view for search and replace
  currentMatch: number
  caseSensitive: boolean
  ignoreDiacritics: boolean
}

export const searchReplaceKey = new PluginKey<SearchReplacePluginState>(
  'findReplace'
)

function removeDiacritics(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function getMatches(
  doc: ProseMirrorNode,
  value: string,
  caseSensitive: boolean,
  ignoreDiacritics: boolean
) {
  if (!value) {
    return []
  }
  let normalised = caseSensitive ? value : value.toLocaleLowerCase()
  if (ignoreDiacritics) {
    normalised = removeDiacritics(normalised)
  }
  const matches: Array<{ from: number; to: number }> = []

  doc.descendants((node, pos) => {
    if (isDeleted(node) || isDeletedText(node)) {
      return
    }
    if (node.isText && node.text) {
      let base = caseSensitive ? node.text : node.text.toLocaleLowerCase()
      if (ignoreDiacritics) {
        base = removeDiacritics(base)
      }
      let index = base.indexOf(normalised)
      while (index !== -1) {
        matches.push({
          from: pos + index,
          to: pos + index + normalised.length,
        })
        index = base.indexOf(normalised, index + normalised.length)
      }
    }
  })

  return matches
}

function buildPluginState(
  state: EditorState,
  oldData?: SearchReplacePluginState,
  newData?: Partial<SearchReplacePluginState>,
  pointerChanged?: boolean
) {
  // this is need to allows components that update this plugin states to update it partially and not the entire state
  const data: SearchReplacePluginState = {
    value: '',
    replaceValue: '',
    active: false,
    activeAdvanced: false,
    currentMatch: -1, // index of a currently selected match
    matches: [],
    caseSensitive: false,
    ignoreDiacritics: false,
    ...oldData,
    ...newData,
  }

  // if user changes pointer position - we drop previous index so if next time user move selection it will be recalculated against the new pointer
  if (pointerChanged) {
    data.currentMatch = -1
  }

  // creating a new set of matches if search value has changed and not falsy
  data.matches = getMatches(
    state.doc,
    data.value,
    data.caseSensitive,
    data.ignoreDiacritics
  )
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
        if (!$old || tr.getMeta(searchReplaceKey) || tr.getMeta('pointer')) {
          return buildPluginState(
            newState,
            $old,
            tr.getMeta(searchReplaceKey),
            !!tr.getMeta('pointer')
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
          if (pluginState.currentMatch === i) {
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
