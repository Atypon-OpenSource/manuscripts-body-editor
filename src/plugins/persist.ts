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
import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  generateNodeID,
  isFootnoteNode,
  isListNode,
} from '@manuscripts/transform'
import { Plugin } from 'prosemirror-state'

/**
 * This plugin ensures that all nodes which need ids (i.e. `id` is defined in the node spec's attributes) are given an id, and that there aren't any duplicate ids in the document.
 */
export default () => {
  return new Plugin<null>({
    appendTransaction(transactions, oldState, newState) {
      // only scan if nodes have changed
      if (!transactions.some((transaction) => transaction.docChanged)) {
        return null
      }
      const newTr = newState.tr
      const diffStart = oldState.doc.content.findDiffStart(newState.doc.content)
      const diffEnd = oldState.doc.content.findDiffEnd(newState.doc.content)
      const ids = new Set<string>()
      if (diffStart || diffEnd) {
        const start = diffStart || 0
        const end = diffEnd ? diffEnd.b : newState.doc.nodeSize - 2
        let endOfList = 0,
          endOfFootnote = 0
        newState.doc.nodesBetween(start, end, (node, pos) => {
          const { id } = node.attrs
          // Block nodes inside list or footnote nodes don't need ids
          if (isListNode(node)) {
            endOfList = Math.max(endOfList, pos + node.nodeSize)
          } else if (isFootnoteNode(node)) {
            endOfFootnote = Math.max(endOfFootnote, pos + node.nodeSize)
          }
          const insideList = pos <= endOfList
          const insideFootnote = pos <= endOfFootnote
          if (
            'id' in node.attrs &&
            ((!insideList && !insideFootnote) || node.isInline) &&
            (!id || id.length === 0 || ids.has(id))
          ) {
            const newId = generateNodeID(node.type)
            const updatedAttrs = { ...node.attrs, id: newId }
            newTr.setNodeMarkup(pos, undefined, updatedAttrs, node.marks)
            ids.add(newId)
          }
        })
        skipTracking(newTr)
        newTr.setMeta('origin', 'persist')
        return newTr
      }
      return null
    },
  })
}
