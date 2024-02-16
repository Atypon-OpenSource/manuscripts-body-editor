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

import { InlineFootnoteNode, schema } from '@manuscripts/transform'
import { ResolvedPos } from 'prosemirror-model'
import { findChildren, findParentNodeClosestToPos } from 'prosemirror-utils'

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
          .map(({ node }) => (node as InlineFootnoteNode).attrs.rids)
          .flat()
      : []
  )
}

export const createFootnoteLabel = (id: string) => {
  const _id = parseInt(id, 10) + 1 // convert to number starting from 1
  const START = 96 // ASCII code for 'a' (-1)
  const RANGE = 26 // number of letters in the alphabet
  const id1 = _id % RANGE || RANGE
  const id2 = Math.ceil(_id / RANGE)
  const label =
    id2 === 1
      ? String.fromCharCode(START + id1)
      : `${String.fromCharCode(START + id2 - 1)}${String.fromCharCode(
          START + id1
        )}`
  return label
}