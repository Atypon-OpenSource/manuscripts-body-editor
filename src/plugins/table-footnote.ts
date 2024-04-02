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
import { schema } from '@manuscripts/transform'
import { Plugin } from 'prosemirror-state'
import { ReplaceStep } from 'prosemirror-transform'
import {
  findChildrenByType,
  findParentNodeClosestToPos,
} from 'prosemirror-utils'

import { updateTableInlineFootnoteLabels } from './footnotes/footnotes-utils'

export default () => {
  return new Plugin({
    appendTransaction(transactions, oldState, newState) {
      const tableInlineFootnoteChange = transactions.find((tr) =>
        tr.steps.find((s) => {
          if (s instanceof ReplaceStep) {
            const $pos = oldState.doc.resolve((s as ReplaceStep).from)
            return (
              $pos.node().type === schema.nodes.table_cell &&
              $pos.node($pos.depth - 2).type === schema.nodes.table
            )
          }
        })
      )

      if (!tableInlineFootnoteChange) {
        return null
      }

      const step = tableInlineFootnoteChange.steps[0] as ReplaceStep

      const tr = newState.tr
      const $pos = newState.doc.resolve(step.from)

      const table = findParentNodeClosestToPos(
        $pos,
        (node) => node.type === schema.nodes.table_element
      )

      const footnotesElementWithPos =
        table &&
        findChildrenByType(table.node, schema.nodes.footnotes_element).pop()

      if (!table || !footnotesElementWithPos) {
        return null
      }

      return updateTableInlineFootnoteLabels(tr, table, footnotesElementWithPos)
    },
  })
}
