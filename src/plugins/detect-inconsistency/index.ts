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

import { Plugin, PluginKey } from 'prosemirror-state'
import { DecorationSet } from 'prosemirror-view'

import { EditorProps } from '../../configs/ManuscriptsEditor'
import { buildPluginState } from './plugin-state'
import type { PluginState } from './types'

export type { Inconsistency, InconsistencyAction } from './types'

export const detectInconsistencyKey = new PluginKey<PluginState>(
  'detectInconsistency'
)

export default (props: EditorProps) => {
  return new Plugin<PluginState>({
    key: detectInconsistencyKey,
    state: {
      init: (_, state) => buildPluginState(state, props, false),
      apply: (tr, value, _, newState) => {
        const metaValue = tr.getMeta(detectInconsistencyKey)
        const showDecorations =
          metaValue !== undefined ? metaValue : value.showDecorations
        const nextValidations = props.getValidations?.() ?? props.validations
        if (
          !tr.docChanged &&
          metaValue === undefined &&
          nextValidations === value.validations
        ) {
          return value
        }
        return buildPluginState(newState, props, showDecorations)
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
