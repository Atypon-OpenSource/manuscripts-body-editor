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
  CHANGE_OPERATION,
  CHANGE_STATUS,
  TrackedAttrs,
} from '@manuscripts/track-changes-plugin'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export default () => {
  return new Plugin({
    props: {
      decorations(state) {
        const decos: Decoration[] = []

        // Find all nodes that are deleted parts of move operations
        state.doc.descendants((node, pos) => {
          const moveTrack = node.attrs.dataTracked?.find(
            (t: TrackedAttrs) =>
              t.operation === CHANGE_OPERATION.delete &&
              t.status === CHANGE_STATUS.pending &&
              t.moveNodeId // Has an associated move operation
          )

          if (moveTrack) {
            decos.push(
              Decoration.node(pos, pos + node.nodeSize, {
                class: 'move-deleted-node',
                'data-move-id': moveTrack.moveNodeId,
                'data-original-id': node.attrs.id,
              })
            )
          }
        })

        return DecorationSet.create(state.doc, decos)
      },
    },
  })
}
