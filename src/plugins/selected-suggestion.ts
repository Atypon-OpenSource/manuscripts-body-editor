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
import { CHANGE_STATUS, TrackedAttrs } from '@manuscripts/track-changes-plugin'
import { ManuscriptEditorState } from '@manuscripts/transform'
import { AllSelection, Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { isNodeSelection, isTextSelection } from '../commands'

export const selectedSuggestionKey = new PluginKey<PluginState>(
  'selected-suggestion'
)

export interface PluginState {
  decorations: DecorationSet
  suggestion?: TrackedAttrs
}

export default () => {
  return new Plugin<PluginState>({
    key: selectedSuggestionKey,
    state: {
      init: (_, state) => buildPluginState(state),
      apply: (tr, value, oldState, newState) => buildPluginState(newState),
    },
    props: {
      decorations: (state) => {
        const suggestion = selectedSuggestionKey.getState(state)
        return suggestion?.decorations || DecorationSet.empty
      },
    },
  })
}

const buildPluginState = (state: ManuscriptEditorState): PluginState => {
  const selection = state.selection
  if (selection instanceof AllSelection) {
    return empty
  }
  const attrs = {
    nodeType: 'span',
    class: 'selected-suggestion',
  }
  if (isTextSelection(selection)) {
    const $cursor = selection.$cursor
    if (!$cursor) {
      return empty
    }
    const node = state.doc.nodeAt($cursor.pos)
    if (!node) {
      return empty
    }
    const suggestion = node.marks[0]?.attrs.dataTracked
    if (suggestion) {
      const from = $cursor.pos - $cursor.textOffset
      const to = from + node.nodeSize
      return {
        suggestion,
        decorations: DecorationSet.create(state.doc, [
          Decoration.inline(from, to, attrs),
        ]),
      }
    }
  } else if (isNodeSelection(selection)) {
    const node = selection.node
    const suggestion = node.attrs.dataTracked?.[0]
    if (suggestion?.status === CHANGE_STATUS.pending) {
      return {
        suggestion,
        decorations: DecorationSet.create(state.doc, [
          Decoration.node(selection.from, selection.to, attrs),
        ]),
      }
    }
  }
  return empty
}

const empty = {
  decorations: DecorationSet.empty,
}
