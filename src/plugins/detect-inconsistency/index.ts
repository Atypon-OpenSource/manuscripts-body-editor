/*!
 * © 2025 Atypon Systems LLC
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

// This plugin is used to detect inconsistencies in the document.
// The plugin will check for cross-references, footnotes, table-footnotes, and citations.
// If one of these doesn't have a linked node, it will add a warning to the node.

import { Plugin, PluginKey } from 'prosemirror-state'
import { DecorationSet } from 'prosemirror-view'

import { buildPluginState, PluginState } from './detect-inconsistency-utils'

export { Warning } from './detect-inconsistency-utils'

export const detectInconsistencyKey = new PluginKey<PluginState>(
  'detectInconsistency'
)

export default () => {
  return new Plugin<PluginState>({
    key: detectInconsistencyKey,
    state: {
      init: (_, state) => buildPluginState(state, false),
      apply: (tr, value, newState) => {
        const showDecorations =
          tr.getMeta(detectInconsistencyKey) !== undefined
            ? tr.getMeta(detectInconsistencyKey)
            : value.showDecorations
        return buildPluginState(newState, showDecorations)
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = detectInconsistencyKey.getState(state)
        return pluginState?.showDecorations
          ? pluginState.decorations
          : DecorationSet.empty
      },
    },
  })
}
