/*!
 * © 2024 Atypon Systems LLC
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

import { FootnoteWithIndex } from '@manuscripts/style-guide'
import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  InlineFootnoteNode,
  isFootnoteNode,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { Fragment, ResolvedPos } from 'prosemirror-model'
import { Transaction } from 'prosemirror-state'
import {
  ContentNodeWithPos,
  findChildren,
  findChildrenByType,
  findParentNodeClosestToPos,
  NodeWithPos,
} from 'prosemirror-utils'

import { isDeleted, isRejectedInsert } from '../../lib/track-changes-utils'

export const findTableInlineFootnoteIds = ($pos: ResolvedPos) => {
  const tableElement = findParentNodeClosestToPos(
    $pos,
    (node) => node.type === schema.nodes.table_element
  )?.node.firstChild

  return new Set(
    tableElement
      ? findChildren(
          tableElement,
          (node) => node.type === schema.nodes.inline_footnote
        )
          .filter(({ node }) => !(isRejectedInsert(node) || isDeleted(node)))
          .map(({ node }) => (node as InlineFootnoteNode).attrs.rids)
          .flat()
      : []
  )
}

export const getNewFootnotePos = (
  footnotesElement: NodeWithPos,
  footnoteIndex: number
) => {
  let newFootnotePos = footnotesElement.pos + footnotesElement.node.nodeSize - 1

  footnotesElement.node.descendants((node, pos, parent, index) => {
    if (isFootnoteNode(node)) {
      if (footnoteIndex === ++index) {
        newFootnotePos = footnotesElement.pos + pos + (index === 1 ? 2 : 1)
      }
    }
  })

  return newFootnotePos
}

export const buildTableFootnoteLabels = (node: ManuscriptNode) => {
  const labels = new Map<string, string | undefined>(
    findChildrenByType(node, schema.nodes.footnote).map((node) => [
      node.node.attrs.id,
      undefined,
    ])
  )

  let index = 0

  findChildrenByType(node, schema.nodes.inline_footnote)
    .filter(({ node }) => !isRejectedInsert(node))
    .map(({ node }) => node.attrs.rids)
    .flat()
    .map((rid: string) => {
      if (!labels.get(rid)) {
        labels.set(rid, String(++index))
      }
    })

  return labels
}

/**
 *  This will make sure un-cited table footnotes are at the end of the list
 *  and order cited footnote based on the position of inline footnote
 */
export const orderTableFootnotes = (
  tr: Transaction,
  footnotesElementWithPos: NodeWithPos,
  position: number
) => {
  const tablesFootnoteLabels = buildTableFootnoteLabels(
    tr.doc.nodeAt(tr.mapping.map(position)) as ManuscriptNode
  )

  const footnotes = findChildrenByType(
    footnotesElementWithPos.node,
    schema.nodes.footnote
  ).map((nodeWithPos) => ({
    node: nodeWithPos.node,
    index: tablesFootnoteLabels.get(nodeWithPos.node.attrs.id),
  })) as FootnoteWithIndex[]

  const orderedFootnotes = [...footnotes]
    .sort((a, b) => {
      if (a.index !== undefined && b.index !== undefined) {
        return Number.parseInt(a.index) - Number.parseInt(b.index)
      } else {
        return a.index === undefined ? 1 : -1
      }
    })
    .map(({ node }) => node)

  const { node: footnotesElement, pos } = footnotesElementWithPos
  const footnoteElementPos = position + pos

  return skipTracking(
    tr.replaceWith(
      tr.mapping.map(footnoteElementPos),
      tr.mapping.map(footnoteElementPos + footnotesElement.nodeSize),
      Fragment.fromArray(orderedFootnotes)
    )
  )
}

export const updateTableInlineFootnoteLabels = (
  tr: Transaction,
  table: ContentNodeWithPos
) => {
  const labels = buildTableFootnoteLabels(table.node)

  findChildrenByType(table.node, schema.nodes.inline_footnote).map(
    ({ node, pos }) => {
      const contents = node.attrs.rids
        .map((rid: string) => labels.get(rid))
        .join(',')

      if (
        contents !== node.attrs.contents &&
        tr.doc.nodeAt(tr.mapping.map(table.pos + pos + 1))
      ) {
        tr.setNodeMarkup(tr.mapping.map(table.pos + pos + 1), undefined, {
          ...node.attrs,
          rids: node.attrs.rids,
          contents,
        })
      }
    }
  )

  return tr
}
interface InlineFootnote {
  node: InlineFootnoteNode
  pos: number
}

export const getInlineFootnotes = (
  id: string,
  tableElement: NodeWithPos
): InlineFootnote[] => {
  const inlineFootnotes: InlineFootnote[] = []

  tableElement.node.content.descendants((node, pos) => {
    if (node.type === schema.nodes.inline_footnote) {
      const footnote = node as InlineFootnoteNode
      if (footnote.attrs.rids?.includes(id)) {
        inlineFootnotes.push({ node: footnote, pos })
      }
    }
  })

  return inlineFootnotes
}
