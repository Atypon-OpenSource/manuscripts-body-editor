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
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
} from '@manuscripts/transform'
import { Node } from 'prosemirror-model'
import { Selection } from 'prosemirror-state'
import { findParentNode } from 'prosemirror-utils'

import { Dispatch } from '../commands'

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
  matcher: (node: ManuscriptNode) => boolean
): ManuscriptNode | undefined => {
  for (const node of iterateChildren(parent)) {
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
  nodeType: ManuscriptNodeType
): boolean => !!getMatchingChild(parent, (node) => node.type === nodeType)

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

export interface viewProps {
  node: ManuscriptNode
  view: ManuscriptEditorView
  getPos: () => number
}

export const setNodeAttrs =
  (
    figure: Node | undefined,
    viewProps: viewProps,
    dispatch: Dispatch,
    pos?: number
  ) =>
  (attrs: Node['attrs']) => {
    const { selection, tr } = viewProps.view.state
    tr.setNodeMarkup(pos || viewProps.getPos() + 1, undefined, {
      // figure in accordance with the schema has to be the first element in the fig element this is why +1 is certain
      ...attrs,
    }).setSelection(selection.map(tr.doc, tr.mapping))

    dispatch(tr)
  }

export const getFileExtension = (file: File) => {
  return file.name.split('.').pop() || ''
}
