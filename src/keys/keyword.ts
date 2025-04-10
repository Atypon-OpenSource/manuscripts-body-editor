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

import { ManuscriptEditorState, schema } from '@manuscripts/transform'

import { isNodeSelection, isTextSelection } from '../commands'
import { EditorAction } from '../types'

const ignoreEnter: EditorAction = (state) => {
  const { selection } = state
  if (!isTextSelection(selection)) {
    return false
  }

  const { $from, $to } = selection
  // Check if the selection starts and ends in a keyword node
  const startNode = $from.node($from.depth)
  const endNode = $to.node($to.depth)

  if (
    startNode.type === state.schema.nodes.keyword ||
    endNode.type === state.schema.nodes.keyword
  ) {
    return true // Ignore Enter key press if selection is within a keyword node
  }

  return false
}

export const ignoreBackSpace = (state: ManuscriptEditorState) => {
  const { selection } = state

  if (!isNodeSelection(selection)) {
    return selection.$from.node().type === schema.nodes.keyword
  }

  return false
}

export const ignoreDelete = (state: ManuscriptEditorState) => {
  const { selection } = state

  if (!isTextSelection(selection)) {
    return false
  }

  return selection.$from.node().type === schema.nodes.keyword
}

const keywordKeymap: { [key: string]: EditorAction } = {
  Enter: ignoreEnter,
  Delete: ignoreDelete,
  Backspace: ignoreBackSpace,
}

export default keywordKeymap
