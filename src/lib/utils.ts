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
  BibliographyItemAttrs,
  BibliographyItemType,
  isElementNodeType,
  isSectionNodeType,
  ManuscriptEditorState,
  ManuscriptNode,
  ManuscriptNodeType,
  schema,
} from '@manuscripts/transform'
import {
  Fragment,
  Node as ProseMirrorNode,
  NodeType,
  ResolvedPos,
} from 'prosemirror-model'
import { EditorState, Selection } from 'prosemirror-state'
import {
  findChildrenByType,
  findParentNode,
  findParentNodeOfTypeClosestToPos,
} from 'prosemirror-utils'

import { fieldConfigMap } from '../components/references/ReferenceForm/config'
import { arrowDown } from '../icons'
import { getEditorProps } from '../plugins/editor-props'
import { isShadowDelete } from './track-changes-utils'

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

export const isNotNull = <T>(a: T | null): a is T => a !== null

export const hasParent = (
  $pos: ResolvedPos,
  type: ManuscriptNodeType | ManuscriptNodeType[]
) => {
  if (Array.isArray(type)) {
    return type.some(
      (nodeType) => !!findParentNodeOfTypeClosestToPos($pos, nodeType)
    )
  }
  return !!findParentNodeOfTypeClosestToPos($pos, type)
}

// It will check if the field should be rendered based on selected item type
// and field name
export const shouldRenderField = (
  field: string,
  type: BibliographyItemType
): boolean => {
  return fieldConfigMap[type]?.has(field) ?? false
}

// It will clean unnecessary fields from the item
// id and type will be kept
export const cleanItemValues = (item: BibliographyItemAttrs) => {
  const type = item.type as BibliographyItemType
  const cleanedItem: BibliographyItemAttrs = { ...item }

  for (const key of Object.keys(item) as (keyof BibliographyItemAttrs)[]) {
    if (!shouldRenderField(key, type)) {
      switch (key) {
        case 'id':
        case 'type':
          break
        case 'author':
        case 'editor':
        case 'issued':
        case 'accessed':
        case 'event-date':
          cleanedItem[key] = undefined
          break
        default:
          cleanedItem[key] = ''
      }
    }
  }
  return cleanedItem
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

export const filterBlockNodes = (
  fragment: Fragment,
  predicate: (node: ProseMirrorNode) => boolean
) => {
  const updatedNodes: ProseMirrorNode[] = []

  fragment.forEach((child) => {
    if (!child.isBlock) {
      updatedNodes.push(child)
      return
    }

    const newContent = child.content.size
      ? filterBlockNodes(child.content, predicate)
      : child.content
    if (predicate(child)) {
      updatedNodes.push(child.type.create(child.attrs, newContent, child.marks))
    }
  })

  return Fragment.fromArray(updatedNodes)
}
export const getLastTitleNode = (state: ManuscriptEditorState) => {
  const altTitleNode = findChildrenByType(
    state.doc,
    state.schema.nodes.alt_titles
  )[0]
  if (altTitleNode) {
    return altTitleNode
  }

  const titleNode = findChildrenByType(state.doc, state.schema.nodes.title)[0]
  return titleNode
}

/** traverse viewable nodes, that are not tracked as delete with moveNodeId */
export const visibleDescendants = (
  doc: ProseMirrorNode,
  callback: (
    node: ProseMirrorNode,
    pos: number,
    parent: ProseMirrorNode | null,
    index: number
  ) => void | boolean
) => {
  doc.descendants((node, pos, parent, index) => {
    if (isShadowDelete(node)) {
      return false
    }
    callback(node, pos, parent, index)
  })
}
