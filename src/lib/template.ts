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

import { ManuscriptNodeType } from '@manuscripts/transform'
import { EditorState } from 'prosemirror-state'

import { getEditorProps } from '../plugins/editor-props'

export const templateAllows = (
  state: EditorState,
  nodeType: ManuscriptNodeType
) => {
  const props = getEditorProps(state)
  const hiddenNodeTypes = props?.hiddenNodeTypes
  return !hiddenNodeTypes?.length || !hiddenNodeTypes.includes(nodeType)
}
