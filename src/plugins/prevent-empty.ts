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
import { schema } from '@manuscripts/transform'
import { Plugin } from 'prosemirror-state'

/**
 * This plugin prevent complete removal of minimal allowed content - empty title and empty paragraph in the only section in the doc
 */
export default () => {
  return new Plugin<null>({
    appendTransaction(transactions, oldState, newState) {
      let emptyBody = false
      let bodyPos = -1
      newState.doc.descendants((node, pos) => {
        if (bodyPos >= 0) {
          return false
        }
        if (node.type === schema.nodes.body) {
          bodyPos = pos
          emptyBody = node.childCount == 0
        }
      })

      if (emptyBody) {
        const tr = newState.tr
        tr.insert(bodyPos + 1, schema.nodes.paragraph.create())
        tr.setMeta('prevent-empty', true)
        skipTracking(tr)
        return tr
      }

      return null
    },
  })
}
