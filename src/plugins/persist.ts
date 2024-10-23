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
import { generateNodeID, ManuscriptNode, schema } from '@manuscripts/transform'
import { Plugin } from 'prosemirror-state'

/**
 * This plugin ensures that all nodes which need ids (i.e. `id` is defined in the node spec's attributes) are given an id, and that there aren't any duplicate ids in the document.
 */

const isManuscriptNode = (node: ManuscriptNode | null) => {
  return node && node.type === schema.nodes.manuscript
}

export default () => {
  return new Plugin<null>({
    appendTransaction(transactions, oldState, newState) {
      // only scan if nodes have changed
      if (!transactions.some((tr) => tr.docChanged)) {
        return null
      }
      const ids = new Set<string>()
      const tr = newState.tr
      newState.doc.descendants((node, pos, parent) => {
        if (
          (!(node.type.spec.attrs && 'id' in node.type.spec.attrs) &&
            node.isInline) ||
          isManuscriptNode(node) ||
          isManuscriptNode(parent)
        ) {
          return
        }
        let id = node.attrs.id
        if (!id || ids.has(id)) {
          id = generateNodeID(node.type)
          tr.setNodeMarkup(
            pos,
            undefined,
            {
              ...node.attrs,
              id,
            },
            node.marks
          )
        }
        ids.add(id)
      })
      skipTracking(tr)
      tr.setMeta('origin', 'persist')
      return tr
    },
  })
}
