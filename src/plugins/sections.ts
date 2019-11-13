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
  isSectionNode,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import { Plugin } from 'prosemirror-state'

export default () => {
  return new Plugin<{}, ManuscriptSchema>({
    appendTransaction: (transactions, oldState, newState) => {
      const positionsToInsert: number[] = []

      const tr = newState.tr

      // if (!transactions.some(tr => tr.docChanged)) return null

      newState.doc.descendants((node, pos) => {
        if (!isSectionNode(node)) return false

        // add a paragraph to sections with only titles
        if (node.childCount === 1) {
          const childNode = node.child(0)

          if (childNode.type === childNode.type.schema.nodes.section_title) {
            positionsToInsert.push(pos + node.nodeSize - 1)
          }
        }
      })

      // return the transaction if something changed
      if (positionsToInsert.length) {
        // execute the inserts in reverse order so the positions don't change
        positionsToInsert.reverse()

        for (const pos of positionsToInsert) {
          const paragraph = newState.schema.nodes.paragraph.create()
          tr.insert(pos, paragraph)
        }

        return tr
      }
    },
  })
}
