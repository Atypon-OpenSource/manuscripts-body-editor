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

import {
  isHighlightMarkerNode,
  ManuscriptEditorState,
} from '@manuscripts/transform'
import { Selection } from 'prosemirror-state'

import { Dispatch, isTextSelection } from '../commands'
import { EditorAction } from '../types'

const skipHighlightNode =
  (dir: number): EditorAction =>
  (state: ManuscriptEditorState, dispatch?: Dispatch) => {
    const { selection, tr } = state

    if (isTextSelection(selection)) {
      const { $anchor, $cursor } = selection

      if ($cursor) {
        const adjacentNode = dir === -1 ? $cursor.nodeBefore : $cursor.nodeAfter

        if (adjacentNode && isHighlightMarkerNode(adjacentNode)) {
          const $adjacentPos = tr.doc.resolve($anchor.pos + dir)

          const adjacentSelection = Selection.findFrom($adjacentPos, dir, true)

          if (adjacentSelection) {
            // TODO: handle multiple adjacent markers

            tr.setSelection(adjacentSelection)

            if (dispatch) {
              dispatch(tr)
            }
          }
        }
      }
    }

    return false
  }

const highlightKeymap: { [key: string]: EditorAction } = {
  Backspace: skipHighlightNode(-1),
  Delete: skipHighlightNode(1),
  ArrowLeft: skipHighlightNode(-1),
  ArrowRight: skipHighlightNode(1),
}

export default highlightKeymap
