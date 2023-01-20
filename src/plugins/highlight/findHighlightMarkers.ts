/*!
 * © 2021 Atypon Systems LLC
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
import { isHighlightMarkerNode } from '@manuscripts/transform'
import { Node as PMNode } from 'prosemirror-model'

import { HighlightMarker, HighlightStartMarker } from './types'

export function findHighlightMarkers(doc: PMNode) {
  const markers: HighlightMarker[] = []
  let current: HighlightStartMarker | undefined
  doc.descendants((node, pos) => {
    if (isHighlightMarkerNode(node)) {
      const { position, tid, id } = node.attrs
      if (position === 'start') {
        current = {
          start: pos + 1,
          id,
          tid,
        }
      } else if (position === 'end' && current) {
        markers.push({
          ...current,
          text: doc.textBetween(current.start, pos, '\n'),
          end: pos,
        })
        current = undefined
      }
    }
  })
  return markers
}
