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
import { isEqual } from 'lodash'
import { NodeType } from 'prosemirror-model'

import {
  createDeleteAttrsDataTracked,
  createInsertAttrsDataTracked,
  createSetAttrsDataTracked,
} from './create-dataTracked-attrs'

// the following function compares the attributes of two nodes and returns a new node with the differences
// it is used only for nodes that do not have a textnode content

export const compareNodeAttrs = (
  wrapperAttrs: Record<string, any>,
  originalNode: ManuscriptNode,
  comparisonNode: ManuscriptNode,
  itemNodeType: NodeType,
  wrapperNodeType: NodeType
): ManuscriptNode => {
  const diffs: ManuscriptNode[] = []

  const originalMap = new Map<string, ManuscriptNode>()
  const comparisonMap = new Map<string, ManuscriptNode>()
  originalNode.content.content.forEach((item) => {
    originalMap.set(item.attrs.id, item)
  })

  comparisonNode.content.content.forEach((item) => {
    comparisonMap.set(item.attrs.id, item)
  })
  // Handle deleted or modified
  originalMap.forEach((originalItem, id) => {
    const comparisonItem = comparisonMap.get(id)

    if (!comparisonItem) {
      diffs.push(
        itemNodeType.create(
          {
            ...originalItem.attrs,
            dataTracked: [createDeleteAttrsDataTracked(id, originalItem.attrs)],
          },
          originalItem.content
        )
      )
    } else if (!isEqual(originalItem.attrs, comparisonItem.attrs)) {
      diffs.push(
        itemNodeType.create(
          {
            ...comparisonItem.attrs,
            dataTracked: [createSetAttrsDataTracked(id, originalItem.attrs)],
          },
          originalItem.content
        )
      )
    } else {
      diffs.push(comparisonItem)
    }
  })

  // Handle additions
  comparisonMap.forEach((comparisonItem, id) => {
    if (!originalMap.has(id)) {
      diffs.push(
        itemNodeType.create(
          {
            ...comparisonItem.attrs,
            dataTracked: [
              createInsertAttrsDataTracked(id, comparisonItem.attrs),
            ],
          },
          comparisonItem.content
        )
      )
    }
  })

  return wrapperNodeType.create(wrapperAttrs, diffs)
}

export const compareSingleNodeAttrs = (
  originalNode: ManuscriptNode,
  comparisonNode: ManuscriptNode,
  nodeType: NodeType
): ManuscriptNode => {
  const originalAttrs = originalNode?.attrs || {}
  const comparisonAttrs = comparisonNode?.attrs || {}

  if (!isEqual(originalAttrs, comparisonAttrs)) {
    return nodeType.create(
      {
        ...comparisonAttrs,
        dataTracked: [createSetAttrsDataTracked('', originalAttrs)],
      },
      comparisonNode?.content || null
    )
  } else {
    return nodeType.create(comparisonAttrs, comparisonNode?.content || null)
  }
}
