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

import {
  InlineFootnoteNode,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { findChildren } from 'prosemirror-utils'
import { Decoration } from 'prosemirror-view'

import { uncitedTableFootnoteIcon } from '../../assets'

export const addDecorationToUncitedTableFootnotes = (
  decorations: Decoration[],
  tableElement: ManuscriptNode,
  tableElementPos: number
) => {
  const tableElementFooterWithPos = findChildren(
    tableElement,
    (node) => node.type === schema.nodes.table_element_footer,
    false
  ).shift()

  const tableBody =
    tableElement.firstChild &&
    findChildren(
      tableElement.firstChild,
      (node) => node.type === schema.nodes.table_body,
      false
    ).shift()?.node

  if (!tableElementFooterWithPos || !tableBody) {
    return
  }

  const tableInlineFootnoteIds = new Set(
    findChildren(
      tableBody,
      (node) => node.type === schema.nodes.inline_footnote
    )
      .map(({ node }) => (node as InlineFootnoteNode).attrs.rids)
      .flat()
  )

  tableElementFooterWithPos.node.descendants((node, pos) => {
    if (node.type === schema.nodes.footnotes_element) {
      if (!tableInlineFootnoteIds.has(node.attrs.id)) {
        decorations.push(
          Decoration.widget(
            tableElementPos + tableElementFooterWithPos.pos + pos,
            uncitedFootnoteWidget()
          )
        )
      }
      return false
    }
  })
}

export const uncitedFootnoteWidget = () => () => {
  const element = document.createElement('span')
  element.className = 'unctied-table-footnote'
  element.innerHTML = uncitedTableFootnoteIcon
  return element
}
