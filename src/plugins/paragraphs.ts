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

import { isParagraphNode, ManuscriptNode } from '@manuscripts/transform'
import { Plugin } from 'prosemirror-state'

/**
 * This plugin enforces a rule that there can never be more than one adjacent empty paragraph.
 */
export default () => {
  return new Plugin<null>({
    appendTransaction: (transactions, oldState, newState) => {
      const positionsToJoin: number[] = []

      const tr = newState.tr

      if (!transactions.some((tr) => tr.docChanged || tr.getMeta('INIT'))) {
        return null
      }

      const joinAdjacentParagraphs =
        (parent: ManuscriptNode, pos: number) =>
        (node: ManuscriptNode, offset: number, index: number) => {
          const nodePos = pos + offset

          if (
            isParagraphNode(node) &&
            node.childCount === 0 &&
            index < parent.childCount - 1
          ) {
            const nextNode = parent.child(index + 1)

            if (isParagraphNode(nextNode) && nextNode.childCount === 0) {
              positionsToJoin.push(nodePos + node.nodeSize)
            }
          }

          node.forEach(joinAdjacentParagraphs(node, nodePos + 1))
        }

      newState.doc.forEach(joinAdjacentParagraphs(newState.doc, 0))

      if (positionsToJoin.length) {
        // execute the joins in reverse order so the positions don't change
        positionsToJoin.reverse()

        for (const nodePos of positionsToJoin) {
          tr.join(nodePos)
        }
        tr.setMeta('origin', 'paragraphs')
        return tr
      }
    },
  })
}
