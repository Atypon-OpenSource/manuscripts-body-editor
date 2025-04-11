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
  isElementNodeType,
  isSectionNodeType,
  ManuscriptNode,
  ManuscriptNodeType,
} from '@manuscripts/transform'
import { Node as ProseMirrorNode, NodeType } from 'prosemirror-model'
import { EditorState, Selection } from 'prosemirror-state'
import {
  findParentNode,
  findParentNodeOfTypeClosestToPos,
} from 'prosemirror-utils'
import { ResolvedPos } from 'prosemirror-model'

export function* iterateChildren(
  node: ManuscriptNode,
  recurse = false
): Iterable<ManuscriptNode> {
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i)
    yield child

    if (recurse) {
      for (const grandchild of iterateChildren(child, true)) {
        yield grandchild
      }
    }
  }
}

export const getMatchingChild = (
  parent: ManuscriptNode,
  matcher: (node: ManuscriptNode) => boolean,
  deep = false
): ManuscriptNode | undefined => {
  for (const node of iterateChildren(parent, deep)) {
    if (matcher(node)) {
      return node
    }
  }
}

export const getMatchingDescendant = (
  parent: ManuscriptNode,
  matcher: (node: ManuscriptNode) => boolean
): ManuscriptNode | undefined => {
  for (const node of iterateChildren(parent, true)) {
    if (matcher(node)) {
      return node
    }
  }
}

export const getChildOfType = (
  parent: ManuscriptNode,
  nodeType: ManuscriptNodeType,
  deep = false
): boolean =>
  !!getMatchingChild(parent, (node) => node.type.name === nodeType.name, deep)

export const findParentNodeWithId = findParentNode((node) => 'id' in node.attrs)

export const findParentNodeWithIdValue = findParentNode((node) => node.attrs.id)

export const findParentSection = findParentNode((node) =>
  isSectionNodeType(node.type)
)

export const findParentElement = (selection: Selection, validIds?: string[]) =>
  findParentNode((node) => {
    // if validIds was passed and this element is not in it, then keep looking
    if (validIds && !validIds.includes(node.attrs.id)) {
      return false
    }
    return isElementNodeType(node.type) && node.attrs.id
  })(selection)

export const isChildOfNodeTypes = (
  doc: ManuscriptNode,
  pos: number,
  parentNodeTypes: NodeType[]
) => {
  const resolvedPos = doc.resolve(pos)
  // Iterate through the parent nodes
  for (let depth = resolvedPos.depth; depth >= 0; depth--) {
    if (parentNodeTypes.includes(resolvedPos.node(depth).type)) {
      return true
    }
  }

  return false
}

/**
 * Check if selection is inside the given node
 * @param state - the editor state
 * @param targetNode - the node to check if the selection is inside
 * @return boolean
 */
export const isSelectionInNode = (
  state: EditorState,
  targetNode: ProseMirrorNode
) => {
  const resolvedFrom = state.doc.resolve(state.selection.from)

  for (let depth = resolvedFrom.depth; depth >= 0; depth--) {
    const node = resolvedFrom.node(depth)
    if (node === targetNode) {
      return true
    }
  }
  return false
}

export const createHeader = (typeName: string, text: string) => {
  const header = document.createElement('h1')
  header.classList.add(`title-${typeName}`, 'authors-info-header')
  header.textContent = text
  return header
}

export const isNotNull = <T>(a: T | null): a is T => a !== null

export const hasParent = ($pos: ResolvedPos, type: ManuscriptNodeType) => {
  return !!findParentNodeOfTypeClosestToPos($pos, type)
}
