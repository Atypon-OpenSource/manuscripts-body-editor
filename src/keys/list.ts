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
import { ManuscriptEditorState, schema } from '@manuscripts/transform'
import { joinBackward } from 'prosemirror-commands'
import { Fragment, NodeType, Slice } from 'prosemirror-model'
import {
  liftListItem,
  splitListItem,
  wrapInList,
} from 'prosemirror-schema-list'
import { Command, EditorState, Transaction } from 'prosemirror-state'
import { ReplaceAroundStep } from 'prosemirror-transform'
import { findParentNodeOfType } from 'prosemirror-utils'

import { Dispatch } from '../commands'
import { EditorAction } from '../types'

// TODO:: remove this command when quarterback start supporting list_item and the operation on the list
export const skipCommandTracking =
  (command: Command) => (state: ManuscriptEditorState, dispatch?: Dispatch) => {
    return command(state, (tr) => {
      if (dispatch) {
        skipTracking(tr)
        dispatch(tr)
      }
    })
  }

const listItemBackward = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => {
  const { selection } = state
  const isListItem = findParentNodeOfType(schema.nodes.list_item)(selection)

  if (isListItem) {
    return joinBackward(state, dispatch)
  }

  return false
}

// Lift the list item if it's inside a parent list.
const liftToOuterList = (itemType: NodeType): Command => {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void) {
    const { $from, $to } = state.selection
    const range = $from.blockRange(
      $to,
      (node) => node.childCount > 0 && node.firstChild?.type == itemType
    )
    if (!range) {
      return false
    }
    if (!dispatch) {
      return true
    }
    if ($from.node(range.depth - 1).type == itemType) {
      // Inside a parent list
      return liftListItem(itemType)(state, dispatch)
    } // Outer list node
    else {
      return false
    }
  }
}

// This fucntion is forked from the prosemirror-schema-list package, since the original function does not support cloning attributes from the parent list.
export function sinkListItem(itemType: NodeType): Command {
  return function (state, dispatch) {
    const { $from, $to } = state.selection
    const range = $from.blockRange(
      $to,
      (node) => node.childCount > 0 && node.firstChild?.type == itemType
    )
    if (!range) {
      return false
    }
    const startIndex = range.startIndex
    if (startIndex == 0) {
      return false
    }
    const parent = range.parent,
      nodeBefore = parent.child(startIndex - 1)
    if (nodeBefore.type != itemType) {
      return false
    }
    if (dispatch) {
      const nestedBefore =
        nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type
      const listType = parent.attrs.listStyleType
      const inner = Fragment.from(nestedBefore ? itemType.create() : null)
      const slice = new Slice(
        Fragment.from(
          itemType.create(
            null,
            Fragment.from(
              parent.type.create({ listStyleType: listType }, inner)
            )
          )
        ),
        nestedBefore ? 3 : 1,
        0
      )
      const before = range.start,
        after = range.end
      dispatch(
        state.tr
          .step(
            new ReplaceAroundStep(
              before - (nestedBefore ? 3 : 1),
              after,
              before,
              after,
              slice,
              1,
              true
            )
          )
          .scrollIntoView()
      )
    }
    return true
  }
}

const listKeymap: { [key: string]: EditorAction } = {
  Enter: splitListItem(schema.nodes.list_item),
  'Mod-[': skipCommandTracking(liftToOuterList(schema.nodes.list_item)), // outdent
  'Mod-]': skipCommandTracking(sinkListItem(schema.nodes.list_item)), // indent
  'Mod-Alt-o': skipCommandTracking(
    wrapInList(schema.nodes.list, { listStyleType: 'order' })
  ),
  'Mod-Alt-k': skipCommandTracking(
    wrapInList(schema.nodes.list, { listStyleType: 'bullet' })
  ),
  'Shift-Tab': skipCommandTracking(liftToOuterList(schema.nodes.list_item)), // outdent, same as Mod-[
  Tab: skipCommandTracking(sinkListItem(schema.nodes.list_item)), // indent, same as Mod-]
  Backspace: skipCommandTracking(listItemBackward),
}

export default listKeymap
