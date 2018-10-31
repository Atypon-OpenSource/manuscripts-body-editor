import { NodeType } from 'prosemirror-model'
import { findParentNode } from 'prosemirror-utils'
import { ManuscriptNode } from '../schema/types'

export function* iterateChildren(
  node: ManuscriptNode,
  recurse: boolean = false
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

export const getChildOfType = (
  parent: ManuscriptNode,
  nodeType: NodeType
): boolean => !!getMatchingChild(parent, node => node.type === nodeType)

export const findParentNodeWithId = findParentNode(node => 'id' in node.attrs)
