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

import { isTextSelection } from '../commands'
import { EditorAction } from '../types'

const ignoreEnter: EditorAction = (state) => {
  const { selection } = state

  if (!isTextSelection(selection)) {
    return false
  }
  const { $cursor } = selection

  if (!$cursor) {
    return false
  }

  if ($cursor.parent.type !== $cursor.parent.type.schema.nodes.keyword) {
    return false
  }
  return true
}

const keywordKeymap: { [key: string]: EditorAction } = {
  Enter: ignoreEnter,
}

export default keywordKeymap
