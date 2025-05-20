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
import { ManuscriptNode, schema } from '@manuscripts/transform'
import { NodeType } from '@remirror/pm/model'
import diff_match_patch from 'diff-match-patch'
import { v4 as uuidv4 } from 'uuid'

export const compareTextNodes = (
  original: ManuscriptNode,
  comparison: ManuscriptNode,
  nodeType: NodeType
) => {
  const dmp = new diff_match_patch()
  const diffs = dmp.diff_main(original.textContent, comparison.textContent)
  dmp.diff_cleanupSemantic(diffs)

  const content = diffs.map(([op, text]) => {
    if (op === -1) {
      return schema.text(text, [
        schema.marks.tracked_delete.create({ dataTracked: { id: uuidv4() } }),
      ])
    } else if (op === 1) {
      return schema.text(text, [
        schema.marks.tracked_insert.create({ dataTracked: { id: uuidv4() } }),
      ])
    } else {
      return schema.text(text)
    }
  })

  return nodeType.create(comparison.attrs, content)
}
