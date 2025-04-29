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
  schema,
} from '@manuscripts/transform'
import { Node as ProseMirrorNode, NodeType } from 'prosemirror-model'
import { EditorState, Selection } from 'prosemirror-state'
import { findChildrenByType, findParentNode } from 'prosemirror-utils'

import { getEditorProps } from '../plugins/editor-props'

import { arrowDown } from '../icons'

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

export const isSelectionInBody = (state: EditorState): boolean => {
  return isSelectionInNodeByType(state, 'body')
}

const isSelectionInNodeByType = (
  state: EditorState,
  nodeType: string
): boolean => {
  const { $from } = state.selection

  for (let depth = $from.depth; depth >= 0; depth--) {
    if ($from.node(depth).type.name === nodeType) {
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

export const isBodyLocked = (state: EditorState) => {
  const props = getEditorProps(state)
  return (
    !!findChildrenByType(state.doc, schema.nodes.attachment).length &&
    props.lockBody
  )
}

// It checks if the selection is inside a body node and if the body is locked
// the body is locked if feature lockBody is set true and there is an attachment node in document
export const isEditAllowed = (state: EditorState) => {
  return !(isBodyLocked(state) && isSelectionInBody(state))
}

export const createToggleButton = (listener: () => void) => {
  const altTitlesButton = document.createElement('button')
  altTitlesButton.classList.add('toggle-button-open', 'button-reset')
  altTitlesButton.innerHTML = arrowDown
  altTitlesButton.addEventListener('click', (e) => {
    e.preventDefault()
    listener()
  })
  return altTitlesButton
}

export const getInsertPos = (
  type: ManuscriptNodeType,
  parent: ManuscriptNode,
  pos: number
) => {
  let insertPos = pos + parent.nodeSize - 1

  parent.forEach((child, offset, index) => {
    if (parent.canReplaceWith(index, index, type)) {
      insertPos = pos + offset
    }
  })

  return insertPos
}
