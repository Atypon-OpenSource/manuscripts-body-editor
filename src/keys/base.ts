/*!
 * © 2023 Atypon Systems LLC
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
import { ManuscriptEditorState } from '@manuscripts/transform'
import {
  baseKeymap,
  chainCommands,
  createParagraphNear,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
} from 'prosemirror-commands'
import { findParentNode } from 'prosemirror-utils'

import { Dispatch } from '../commands'

const nodeSplit = (state: ManuscriptEditorState, dispatch?: Dispatch) => {
  const contentNode = findParentNode(
    (node) => node.type === node.type.schema.nodes.paragraph
  )(state.selection)

  if (dispatch && contentNode) {
    const {
      tr,
      selection: { $from },
    } = state
    const range = tr.doc.resolve($from.pos).blockRange()

    if (!range) {
      return false
    }

    const remainedContent = contentNode.node.content.cut($from.parentOffset)

    tr.replaceWith(
      $from.pos,
      range.end,
      state.schema.nodes.paragraph.create({}, remainedContent)
    )

    dispatch(tr.scrollIntoView())
    return true
  } else {
    return false
  }
}

const base = {
  ...baseKeymap,
  Enter: chainCommands(
    newlineInCode,
    createParagraphNear,
    liftEmptyBlock,
    nodeSplit,
    splitBlock
  ),
}

export default base
