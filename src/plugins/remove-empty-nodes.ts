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

import { skipTracking } from '@manuscripts/track-changes-plugin'
import { schema } from '@manuscripts/transform'
import { NodeSelection, Plugin } from 'prosemirror-state'

import { affiliationsKey } from './affiliations'

/**
 * Removes empty contributors and affiliations nodes when it's empty
 */
export default () => {
  return new Plugin<null>({
    appendTransaction(transactions, oldState, newState) {
      if (!transactions.some((tr) => tr.docChanged)) {
        return null
      }

      const affs = affiliationsKey.getState(newState)

      if (!affs) {
        return null
      }

      const { selection } = newState
      if (
        selection instanceof NodeSelection &&
        (selection.node.type === schema.nodes.contributors ||
          selection.node.type === schema.nodes.affiliations)
      ) {
        return null
      }

      // Find and remove empty contributors and affiliations nodes
      const tr = newState.tr
      let found = false

      newState.doc.forEach((node, pos) => {
        // Remove empty contributors nodes
        if (
          node.type === schema.nodes.contributors &&
          affs.contributors.length === 0
        ) {
          tr.delete(pos, pos + node.nodeSize)
          found = true
        }
        // Remove empty affiliations nodes
        if (
          node.type === schema.nodes.affiliations &&
          affs.affiliations.length === 0
        ) {
          tr.delete(pos, pos + node.nodeSize)
          found = true
        }
      })

      if (found) {
        skipTracking(tr)
        return tr
      }

      return null
    },
  })
}
