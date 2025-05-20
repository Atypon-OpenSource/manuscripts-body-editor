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
import { findParentNode } from 'prosemirror-utils'

export type NodeComparison = {
  originalNode?: ManuscriptNode
  comparisonNode?: ManuscriptNode
  children?: Map<string, NodeComparison>
  status?: 'deleted' | 'inserted' | 'unchanged'
}

// Creates a unique key for a node based on its type and position or ID
const createNodeKey = (node: ManuscriptNode, index = 0): string => {
  const id = node.attrs.id || node.attrs.objectId
  if (id) {
    return `${node.type.name}:${id}`
  }
  // If no ID is available, use a combination of type and content hash
  return `${node.type.name}:${index}`
}

export const distributeNodesForComparison = (
  originalNodes: ManuscriptNode[],
  comparisonNodes: ManuscriptNode[]
): Map<string, NodeComparison> => {
  const distributedMap = new Map<string, NodeComparison>()

  // Helper function to process child nodes recursivelya
  const processChildNodes = (
    node: ManuscriptNode,
    isOriginal: boolean,
    parentMap: Map<string, NodeComparison>,
    orderMap: Map<string, number>
  ) => {
    // Process child nodes if they exist
    if (node.content && node.content.childCount > 0) {
      // Create an ordered array to track position
      const childKeys: string[] = []

      let count = 0
      node.content.forEach((childNode, index) => {
        // Only process child nodes that are block types
        if (childNode.isBlock) {
          const key = createNodeKey(childNode, count++)
          childKeys.push(key)

          // Store the position in the order map
          if (!isOriginal) {
            orderMap.set(key, index)
          }

          if (!parentMap.has(key)) {
            parentMap.set(key, {
              originalNode: isOriginal ? childNode : undefined,
              comparisonNode: isOriginal ? undefined : childNode,
              children: new Map<string, NodeComparison>(),
              status: isOriginal ? 'deleted' : 'inserted',
            })
          } else {
            const existingEntry = parentMap.get(key)!
            if (isOriginal) {
              existingEntry.originalNode = childNode
            } else {
              existingEntry.comparisonNode = childNode
            }

            // Update status if we now have both nodes
            if (existingEntry.originalNode && existingEntry.comparisonNode) {
              existingEntry.status = 'unchanged'
            }

            if (!existingEntry.children) {
              existingEntry.children = new Map<string, NodeComparison>()
            }
          }

          // Recursively process children of this node
          const childOrderMap = new Map<string, number>()
          processChildNodes(
            childNode,
            isOriginal,
            parentMap.get(key)!.children!,
            childOrderMap
          )
        }
      })

      // When processing the comparison document, reorder the map based on the order of nodes
      if (!isOriginal) {
        // Create a new map with correct order
        const orderedMap = new Map<string, NodeComparison>()

        // Sort keys by their position in the comparison document
        const sortedKeys = [...parentMap.keys()].sort((a, b) => {
          const posA = orderMap.get(a) ?? 999
          const posB = orderMap.get(b) ?? 999
          return posA - posB
        })

        // Rebuild the map in correct order
        for (const key of sortedKeys) {
          orderedMap.set(key, parentMap.get(key)!)
        }

        // Clear the original map and replace with ordered entries
        parentMap.clear()
        for (const [key, value] of orderedMap.entries()) {
          parentMap.set(key, value)
        }
      }
    }
  }

  // First pass: original nodes
  const topLevelOrderMap = new Map<string, number>()
  originalNodes.forEach((node, index) => {
    const key = createNodeKey(node)
    distributedMap.set(key, {
      originalNode: node,
      children: new Map<string, NodeComparison>(),
      status: 'deleted', // Initially marked as deleted until we find a match
    })

    // Store original order
    topLevelOrderMap.set(key, index)

    // Process children for body and backmatter nodes
    if (
      node.type.name === 'body' ||
      node.type.name === 'backmatter' ||
      node.type.name === 'abstracts'
    ) {
      const childOrderMap = new Map<string, number>()
      processChildNodes(
        node,
        true,
        distributedMap.get(key)!.children!,
        childOrderMap
      )
    }
  })

  // Second pass: comparison nodes
  const comparisonOrderMap = new Map<string, number>()
  comparisonNodes.forEach((node, index) => {
    const key = createNodeKey(node)
    comparisonOrderMap.set(key, index)

    if (distributedMap.has(key)) {
      const existingEntry = distributedMap.get(key)!
      existingEntry.comparisonNode = node

      // Since we have both nodes, update status to unchanged
      existingEntry.status = 'unchanged'

      if (!existingEntry.children) {
        existingEntry.children = new Map<string, NodeComparison>()
      }
    } else {
      distributedMap.set(key, {
        comparisonNode: node,
        children: new Map<string, NodeComparison>(),
        status: 'inserted',
      })
    }

    // Process children for body and backmatter nodes
    if (
      node.type.name === 'body' ||
      node.type.name === 'backmatter' ||
      node.type.name === 'abstracts'
    ) {
      const childOrderMap = new Map<string, number>()
      processChildNodes(
        node,
        false,
        distributedMap.get(key)!.children!,
        childOrderMap
      )
    }
  })

  // Final step: reorder the top-level map based on the comparison document
  const finalOrderedMap = new Map<string, NodeComparison>()

  // Sort keys based on their position in the comparison document
  const sortedKeys = [...distributedMap.keys()].sort((a, b) => {
    // Use the position from comparison document, or fallback to original if not in comparison
    const posA = comparisonOrderMap.get(a) ?? topLevelOrderMap.get(a) ?? 999
    const posB = comparisonOrderMap.get(b) ?? topLevelOrderMap.get(b) ?? 999
    return posA - posB
  })

  // Rebuild the map in sorted order
  for (const key of sortedKeys) {
    finalOrderedMap.set(key, distributedMap.get(key)!)
  }

  return finalOrderedMap
}

// export const distributeInlineNodesForComparison = (
//   originalNodes: ManuscriptNode[],
//   comparisonNodes: ManuscriptNode[]
// ): Map<string, { originalNode?: ManuscriptNode; comparisonNode?: ManuscriptNode }> => {
//   const distributedMap = new Map<string, { originalNode?: ManuscriptNode; comparisonNode?: ManuscriptNode }>();

//   // Helper function to create a unique key for each node
//   const createInlineNodeKey = (node: ManuscriptNode): string => {
//     // If node has an ID, use type:id as the key
//     if (node.attrs?.id) {
//       return `${node.type.name}:${node.attrs.id}`;
//     }

//     // For text nodes, use their content as part of the key (limited length)
//     if (node.type.name === 'text' && node.text) {
//       const textPreview = node.text.slice(0, 10);
//       return `text:${textPreview}:${node.marks?.length || 0}`;
//     }

//     // For other nodes without ID, use type and position
//     return `${node.type.name}`;
//   };

//   // First pass: original nodes
//   originalNodes.forEach((node, index) => {
//     const key = createInlineNodeKey(node);
//     // Add sequence number to ensure uniqueness for nodes with same type
//     const uniqueKey = node.attrs?.id ? key : `${key}:orig:${index}`;

//     distributedMap.set(uniqueKey, {
//       originalNode: node,
//     });
//   });

//   // Second pass: comparison nodes
//   comparisonNodes.forEach((node, index) => {
//     const key = createInlineNodeKey(node);

//     // Try to find a matching node in original nodes
//     let matched = false;

//     // If node has ID, look for exact match
//     if (node.attrs?.id) {
//       if (distributedMap.has(key)) {
//         distributedMap.get(key)!.comparisonNode = node;
//         matched = true;
//       }
//     } else {
//       // For nodes without ID (like text), try to find a good match
//       // based on text content similarity if text node
//       for (const [mapKey, entry] of distributedMap.entries()) {
//         if (entry.originalNode && !entry.comparisonNode &&
//             entry.originalNode.type.name === node.type.name) {

//           // For text nodes, check content similarity
//           if (node.type.name === 'text' && node.text && entry.originalNode.text) {
//             if (node.text === entry.originalNode.text) {
//               entry.comparisonNode = node;
//               matched = true;
//               break;
//             }
//           } else {
//             // For other nodes without ID but same type, match first available
//             entry.comparisonNode = node;
//             matched = true;
//             break;
//           }
//         }
//       }
//     }

//     // If no match found, add as a new entry
//     if (!matched) {
//       const uniqueKey = node.attrs?.id ? key : `${key}:comp:${index}`;
//       distributedMap.set(uniqueKey, {
//         comparisonNode: node,
//       });
//     }
//   });

//   return distributedMap;
// };
