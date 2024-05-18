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
import { Plugin, PluginKey } from 'prosemirror-state'

import { EditorProps } from '../configs/ManuscriptsEditor'
import {ManuscriptEditorState} from "@manuscripts/transform";

export const editorPropsKey = new PluginKey<EditorProps>('editor-props')

export default (props: EditorProps) => {
  return new Plugin<EditorProps>({
    key: editorPropsKey,
    state: {
      init: () => {
        return props
      },
      apply: () => {
        return props
      },
    },
  })
}

export const getEditorProps = (state: ManuscriptEditorState) => {
  return editorPropsKey.getState(state) as EditorProps
}
