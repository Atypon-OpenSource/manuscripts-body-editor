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

import {
  isAnySectionNode,
  ManuscriptNode,
} from '@manuscripts/manuscript-transform'

type Coordinates = Array<{ start: number; end: number; id: string }>

export const findDescendantById = (parent: ManuscriptNode, id: string) => {
  let result: { node?: ManuscriptNode; offset?: number } = {}

  parent.descendants((node, pos) => {
    if (id === node.attrs.id) {
      result = {
        node,
        offset: pos + 1,
      }
      return false
    }
  })

  return result
}

export const childSectionCoordinates = (node: ManuscriptNode) => {
  const coordinates: Coordinates = []

  node.forEach((child, pos) => {
    if (isAnySectionNode(child)) {
      coordinates.push({
        start: pos,
        end: pos + child.nodeSize,
        id: child.attrs.id,
      })
    }
  })

  return coordinates
}

// finds the most efficient splice-type command to transition one array into the other
const _diffReplacementBlocks = (
  coords: Coordinates,
  nodes: ManuscriptNode[],
  start: number,
  remove: number
): { start: number; remove: number; insert: ManuscriptNode[] } => {
  if (!coords.length || !nodes.length) {
    return { start, remove, insert: nodes }
  }

  if (coords[0].id === nodes[0].attrs.id) {
    return _diffReplacementBlocks(
      coords.slice(1),
      nodes.slice(1),
      start + 1,
      remove - 1
    )
  }

  if (coords[coords.length - 1].id === nodes[nodes.length - 1].attrs.id) {
    return _diffReplacementBlocks(
      coords.slice(0, coords.length - 1),
      nodes.slice(0, nodes.length - 1),
      start,
      remove - 1
    )
  }

  return { start, remove, insert: nodes }
}

export const diffReplacementBlocks = (
  coords: Coordinates,
  nodes: ManuscriptNode[]
) => _diffReplacementBlocks(coords, nodes, 0, coords.length)
