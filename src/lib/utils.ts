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
  FootnoteNode,
  isElementNodeType,
  isSectionNodeType,
  ManuscriptNode,
  ManuscriptNodeType,
} from '@manuscripts/transform'
import { Fragment } from 'prosemirror-model'
import { Selection, Transaction } from 'prosemirror-state'
import { findParentNode, NodeWithPos } from 'prosemirror-utils'

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

/**
 *  This will make sure un-cited table footnotes are at the end of the list
 *  and order cited footnote based on the position of inline footnote
 */
export const orderTableFootnotes = (
  tr: Transaction,
  notes: FootnoteNode[],
  footnotes: { node: ManuscriptNode; index: number | undefined }[],
  footnotesElementWithPos: NodeWithPos,
  position: number,
  inlineFootnoteIndex: number
) => {
  const selectedNoteMap = new Map(notes.map((note) => [note.attrs.id, note]))
  const orderedFootnotes = [...footnotes]
    .map((note) => {
      if (selectedNoteMap.has(note.node.attrs.id)) {
        return {
          ...note,
          index: inlineFootnoteIndex++,
        }
      }
      if (note.index && note.index <= inlineFootnoteIndex) {
        return {
          ...note,
          index: note.index + 1,
        }
      }
      return note
    })
    .sort(({ index: i1 }, { index: i2 }) => (i1 && i2 ? i1 - i2 : -1))
    .map(({ node }) => node)

  const { node: footnotesElement, pos } = footnotesElementWithPos
  const footnoteElementPos = position + pos

  tr.replaceWith(
    footnoteElementPos,
    footnoteElementPos + footnotesElement.nodeSize,
    Fragment.fromArray(orderedFootnotes)
  )
}

export const isMetaNode = (nodeType: string) =>
  nodeType === schema.nodes.bibliography_item.name ||
  nodeType === schema.nodes.affiliation.name ||
  nodeType === schema.nodes.contributor.name
