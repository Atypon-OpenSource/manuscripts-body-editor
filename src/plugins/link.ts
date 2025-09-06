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
import {
  skipTracking,
  TrackChangesAction,
} from '@manuscripts/track-changes-plugin'
import { schema } from '@manuscripts/transform'
import { NodeSelection, Plugin } from 'prosemirror-state'

/**
 * This plugin make sure unselected link with empty href get deleted
 */
export default () =>
  new Plugin({
    appendTransaction(transactions, oldState, newState) {
      if (
        !transactions.some(
          (tr) =>
            oldState.selection instanceof NodeSelection &&
            oldState.selection.node.type === schema.nodes.link &&
            (tr.getMeta(TrackChangesAction.setChangeStatuses) ||
              (tr.getMeta('pointer') && tr.selectionSet))
        )
      ) {
        return null
      }
      const {
        $from: { pos },
        node,
      } = oldState.selection as NodeSelection
      if (!node.content.size || !node.attrs.href) {
        const tr = newState.tr.setMeta('clear-empty-link', true)
        tr.delete(pos, pos + node.nodeSize)
        return skipTracking(tr.insert(pos, node.content))
      }
      return null
    },
  })
