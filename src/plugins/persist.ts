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
  generateNodeID,
  ManuscriptNode,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import { Plugin } from 'prosemirror-state'

export default () => {
  return new Plugin<{}, ManuscriptSchema>({
    appendTransaction: (transactions, oldState, newState) => {
      // get the transaction from the new state
      const tr = newState.tr

      // only scan if nodes have changed
      if (!transactions.some(transaction => transaction.docChanged)) return null

      // TODO: keep track of changed nodes that haven't been saved yet?
      // TODO: call insertComponent directly?

      const { nodes } = newState.schema

      const listNodeTypes = [nodes.bullet_list, nodes.ordered_list]

      const ids = new Set()

      const nodesToUpdate: Array<{
        node: ManuscriptNode
        pos: number
        id: string
      }> = []

      // for each node in the doc
      newState.doc.descendants((node, pos) => {
        if (!('id' in node.attrs)) {
          return true
        }

        const { id } = node.attrs

        if (id) {
          if (ids.has(id)) {
            // give the duplicate node a new id
            // TODO: maybe change the other node's ID?
            const id = generateNodeID(node.type)
            nodesToUpdate.push({ node, pos, id })
            ids.add(id)
          } else {
            ids.add(id)
          }
        } else {
          // set the id on the node at this position
          const id = generateNodeID(node.type)
          nodesToUpdate.push({ node, pos, id })
          ids.add(id)
        }

        // don't descend into lists
        if (listNodeTypes.includes(node.type)) {
          return false
        }
      })

      // update the nodes and return the transaction if something changed
      if (nodesToUpdate.length) {
        for (const { node, pos, id } of nodesToUpdate) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            id,
          })
        }

        return tr.setSelection(newState.selection)
      }
    },
  })
}
