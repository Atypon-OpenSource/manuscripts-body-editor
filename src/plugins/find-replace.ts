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

import { EditorProps } from '../configs/ManuscriptsEditor'

export type FindReplacePluginState = {
  value: string
  matches: Array<{ from: number; to: number }>
  replaceValue: string
  active: boolean // if the plugin actively display matches
  currentMatch: number
}

export const findReplaceKey = new PluginKey<FindReplacePluginState>(
  'findReplace'
)

function getMatches(doc: ProseMirrorNode, value?: string) {
  if (!value) {
    return []
  }
  const normalised = value.toLocaleLowerCase()
  let matches: Array<{ from: number; to: number }> = []

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      let index = node.text.toLocaleLowerCase().indexOf(normalised)
      while (index !== -1) {
        matches.push({
          from: pos + index,
          to: pos + index + normalised.length,
        })
        index = node.text
          .toLocaleLowerCase()
          .indexOf(normalised, index + normalised.length)
      }
    }
  })

  return matches
}

function buildPluginState(
  state: EditorState,
  oldData?: FindReplacePluginState,
  newData?: Partial<FindReplacePluginState>,
  pointerChanged?: boolean
) {
  // this is need to allows components that update this plugin states to update it partially and not the entire state
  const data: FindReplacePluginState = {
    value: '',
    replaceValue: '',
    active: false,
    currentMatch: -1, // index of a currently selected match
    matches: [],
    ...oldData,
    ...newData,
  }

  // if user changes pointer position - we drop previous index so if next time user move selection it will be recalculated against the new pointer
  if (pointerChanged) {
    data.currentMatch = -1
  }

  // creating a new set of matches if search value has changed and not falsy
  if (!oldData || oldData.value !== newData?.value) {
    data.matches = getMatches(state.doc, data.value)
  }
  return data
}

export default (props: EditorProps) => {
  return new Plugin<FindReplacePluginState>({
    key: findReplaceKey,
    state: {
      init(config, instance) {
        return buildPluginState(instance)
      },
      apply(tr, value, oldState, newState) {
        const $old = findReplaceKey.getState(oldState)
        if (!$old || tr.getMeta(findReplaceKey) || tr.getMeta('pointer')) {
          return buildPluginState(
            newState,
            $old,
            tr.getMeta(findReplaceKey),
            !!tr.getMeta('pointer')
          )
        }
        return $old
      },
    },
    appendTransaction(transactions, oldState, newState) {
      const tr = newState.tr
      const state = findReplaceKey.getState(oldState)

      if (state?.matches && state.replaceValue) {
        state.matches.forEach(({ from, to }) => {
          tr.replaceWith(from, to, newState.schema.text(state.replaceValue))
        })
      }

      return tr
    },
    props: {
      decorations: (state) => {
        const pluginState = findReplaceKey.getState(state)

        if (!pluginState || !pluginState.value || !pluginState.active) {
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
  })
}
