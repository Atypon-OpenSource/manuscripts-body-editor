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
import { isFootnoteNode, ManuscriptNode, schema } from '@manuscripts/transform'
import { Fragment } from 'prosemirror-model'
import { findChildrenByType, NodeWithPos } from 'prosemirror-utils'
import { EditorView } from 'prosemirror-view'

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
    .map(({ node }) => node.attrs.rids)
    .flat()
    .map((rid: string) => {
      if (!labels.get(rid)) {
        labels.set(rid, String(++index))
      }
    })

  return labels
}

export const updateTableInlineFootnoteLabels = (
  tablePos: number,
  view: EditorView
) => {
  const tr = view.state.tr
  const table = tr.doc.nodeAt(tr.mapping.map(tablePos))

  if (!table) {
    return
  }

  const labels = buildTableFootnoteLabels(table)

  findChildrenByType(table, schema.nodes.inline_footnote).map(
    ({ node, pos }) => {
      const contents = node.attrs.rids
        .map((rid: string) => labels.get(rid))
        .join(',')

      if (contents !== node.attrs.contents) {
        tr.setNodeMarkup(tablePos + pos + 1, undefined, {
          ...node.attrs,
          rids: node.attrs.rids,
          contents,
        })
      }
    }
  )

  view.dispatch(skipTracking(tr))
}

/**
 *  This will make sure un-cited table footnotes are at the end of the list
 *  and order cited footnote based on the position of inline footnote
 */
export const orderTableFootnotes = (
  view: EditorView,
  footnotesElementWithPos: NodeWithPos,
  position: number
) => {
  const tr = view.state.tr
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

  view.dispatch(
    skipTracking(
      tr.replaceWith(
        tr.mapping.map(footnoteElementPos),
        tr.mapping.map(footnoteElementPos + footnotesElement.nodeSize),
        Fragment.fromArray(orderedFootnotes)
      )
    )
  )
}
