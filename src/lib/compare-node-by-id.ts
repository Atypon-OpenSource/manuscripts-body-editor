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
import { ManuscriptNode } from '@manuscripts/transform'
import { NodeType } from 'prosemirror-model'

import {
  createDeleteAttrsDataTracked,
  createInsertAttrsDataTracked,
} from './create-dataTracked-attrs'

// the following function compares the attributes of two nodes and returns a new node with the differences
// it is used only for nodes that do not have a textnode content

export const compareNodeById = (
  originalNode: ManuscriptNode[],
  comparisonNode: ManuscriptNode[],
  itemNodeType: NodeType
): ManuscriptNode[] => {
  const diffs: ManuscriptNode[] = []

  const originalMap = new Map<string, ManuscriptNode>()
  const comparisonMap = new Map<string, ManuscriptNode>()
  console.log('originalNode', originalNode)
  originalNode.forEach((item) => {
    originalMap.set(item.attrs.id, item)
  })

  comparisonNode.forEach((item) => {
    comparisonMap.set(item.attrs.id, item)
  })
  // Handle deleted or modified
  originalMap.forEach((originalItem) => {
    const comparisonItem = comparisonMap.get(originalItem.attrs.id)

    if (!comparisonItem) {
      diffs.push(
        itemNodeType.create(
          {
            ...originalItem.attrs,
            dataTracked: [
              createDeleteAttrsDataTracked(
                originalItem.attrs.id,
                originalItem.attrs
              ),
            ],
          },
          originalItem.content
        )
      )
    } else {
      diffs.push(comparisonItem)
    }
  })

  // Handle additions
  comparisonMap.forEach((comparisonItem) => {
    if (!originalMap.has(comparisonItem.attrs.id)) {
      diffs.push(
        itemNodeType.create(
          {
            ...comparisonItem.attrs,
            dataTracked: [
              createInsertAttrsDataTracked(
                comparisonItem.attrs.id,
                comparisonItem.attrs
              ),
            ],
          },
          comparisonItem.content
        )
      )
    }
  })

  return diffs
}
