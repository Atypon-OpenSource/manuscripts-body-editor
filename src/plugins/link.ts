/*!
 * © 2025 Atypon Systems LLC
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

/**
 * This plugin make sure unselected link without link get deleted
 */
export default () =>
  new Plugin({
    appendTransaction(transactions, oldState, newState) {
      if (!transactions.some((tr) => tr.selectionSet)) {
        return null
      }

      const node = newState.doc.nodeAt(oldState.selection.from)
      if (node && node.type === schema.nodes.link) {
        if (!node.content.size || !node.attrs.href) {
          return newState.tr.delete(
            oldState.selection.from,
            oldState.selection.to
          )
        }
      }

      return null
    },
  })
