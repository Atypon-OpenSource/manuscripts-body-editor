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

import {
  CHANGE_OPERATION,
  CHANGE_STATUS,
  TrackedAttrs,
} from '@manuscripts/track-changes-plugin'
import { ManuscriptNode } from '@manuscripts/transform'

/**
 * Check if a node is moved (has pending delete with moveNodeId)
 */
export function isMoved(node: ManuscriptNode) {
  if (node.attrs.dataTracked) {
    const changes = node.attrs.dataTracked as TrackedAttrs[]
    return changes.some(
      ({ operation, status, moveNodeId }) =>
        operation === CHANGE_OPERATION.delete &&
        status === CHANGE_STATUS.pending &&
        moveNodeId
    )
  }
  return false
}

/**
 * Filter out moved nodes from a document
 */
const filterMovedContent = (node: ManuscriptNode) => {
  const nodes: ManuscriptNode[] = []
  node.forEach((child) => {
    const { attrs } = child

    // Check if this node is moved
    if (isMoved(child)) {
      // Skip this node
      return
    }

    if (child.isText) {
      nodes.push(child)
    } else {
      nodes.push(
        child.type.create(attrs, filterMovedContent(child), child.marks)
      )
    }
  })
  return nodes
}

/**
 * Get a document with moved nodes filtered out
 */
export const getDocWithoutMovedContent = (doc: ManuscriptNode) => {
  return doc.type.create(doc.attrs, filterMovedContent(doc), doc.marks)
}
