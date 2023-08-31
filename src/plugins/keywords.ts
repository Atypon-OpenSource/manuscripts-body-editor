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

import { ObjectTypes } from '@manuscripts/json-schema'
import { generateID, ManuscriptNode } from '@manuscripts/transform'
import {
  NodeSelection,
  Plugin,
  PluginKey,
  Transaction,
} from 'prosemirror-state'

export const keywordsKey = new PluginKey('keywords')

const keywordsInserted = (transactions: readonly Transaction[]): boolean =>
  transactions.some((tr) => {
    const meta = tr.getMeta(keywordsKey)

    return meta && meta.keywordsInserted
  })

const keywordDeleted = (transactions: readonly Transaction[]): boolean =>
  transactions.some((tr) => {
    const metaDeleted = tr.getMeta('keywordDeleted')

    return metaDeleted
  })

/**
 * This plugin updates the contents of a Keywords element in the document (if present) when keywords are modified in the manuscript metadata.
 */
export default () => {
  return new Plugin<undefined>({
    key: keywordsKey,

    appendTransaction(transactions, oldState, newState) {
      if (!keywordsInserted(transactions) && !keywordDeleted(transactions)) {
        return
      }

      const keywordsElements: Array<{
        node: ManuscriptNode
        pos: number
      }> = []

      const { tr } = newState

      tr.doc.descendants((node, pos) => {
        if (node.type === node.type.schema.nodes.keywords_element) {
          keywordsElements.push({
            node,
            pos,
          })
        }
      })

      if (keywordsElements.length) {
        for (const { node, pos } of keywordsElements) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            id: node.attrs.id || generateID(ObjectTypes.KeywordsElement),
          })
        }

        // create a new NodeSelection
        // as selection.map(tr.doc, tr.mapping) loses the NodeSelection
        if (tr.selection instanceof NodeSelection) {
          tr.setSelection(NodeSelection.create(tr.doc, tr.selection.from))
        }
        tr.setMeta('origin', keywordsKey)
        return tr
      }
    },
  })
}
