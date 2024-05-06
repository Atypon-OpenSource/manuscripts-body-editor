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
import { NodeType } from 'prosemirror-model'
import {
  liftListItem,
  sinkListItem,
  splitListItem,
  wrapInList,
} from 'prosemirror-schema-list'
import { Command, EditorState, Transaction } from 'prosemirror-state'

import { Dispatch } from '../commands'
import { EditorAction } from '../types'
import { undoInputRule } from 'prosemirror-inputrules'
import { chainCommands, deleteSelection, joinBackward } from 'prosemirror-commands'

// TODO:: remove this command when quarterback start supporting list_item and the operation on the list
export const skipCommandTracking = (command: Command) => (state: ManuscriptEditorState, dispatch?: Dispatch) => {
  let handled = false;  // Variable to capture whether the command handled the action

  command(state, (tr) => {
    handled = true;  // Set to true because the command handled the action and called dispatch
    if (dispatch) {
      skipTracking(tr);
      dispatch(tr);
    }
  });

  return handled;  // Return the captured value
};

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

const listKeymap: { [key: string]: EditorAction } = {
  Enter: splitListItem(schema.nodes.list_item),
  'Mod-[': skipCommandTracking(liftToOuterList(schema.nodes.list_item)), // outdent
  'Mod-]': skipCommandTracking(sinkListItem(schema.nodes.list_item)), // indent
  'Mod-Alt-o': skipCommandTracking(wrapInList(schema.nodes.ordered_list)),
  'Mod-Alt-k': skipCommandTracking(wrapInList(schema.nodes.bullet_list)),
  'Shift-Tab': skipCommandTracking(liftToOuterList(schema.nodes.list_item)), // outdent, same as Mod-[
  Tab: skipCommandTracking(sinkListItem(schema.nodes.list_item)), // indent, same as Mod-]
  Backspace: skipCommandTracking(chainCommands(undoInputRule, joinBackward, deleteSelection))
}

export default listKeymap
