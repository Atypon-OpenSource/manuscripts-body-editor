import { Plugin } from 'prosemirror-state'
import { isParagraphNode } from '../schema/nodes/paragraph'
import { ManuscriptNode, ManuscriptSchema } from '../schema/types'

export default () => {
  return new Plugin<ManuscriptSchema>({
    appendTransaction: (transactions, oldState, newState) => {
      let updated = 0

      const tr = newState.tr

      if (!transactions.some(transaction => transaction.docChanged)) return null

      const joinAdjacentParagraphs = (parent: ManuscriptNode, pos: number) => (
        node: ManuscriptNode,
        offset: number,
        index: number
      ) => {
        const nodePos = pos + offset

        if (
          isParagraphNode(node) &&
          !node.childCount &&
          index < parent.childCount - 1
        ) {
          const nextNode = parent.child(index + 1)

          if (isParagraphNode(nextNode) && nextNode.childCount === 0) {
            tr.join(nodePos + 2)
            updated++
          }
        }

        node.forEach(joinAdjacentParagraphs(node, nodePos + 1))
      }

      newState.doc.forEach(joinAdjacentParagraphs(newState.doc, 0))

      // return the transaction if something changed
      if (updated) {
        return tr.setMeta('addToHistory', false)
      }
    },
  })
}
