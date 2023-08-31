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

import { ManuscriptEditorState, schema } from '@manuscripts/transform'
import { NodeType } from 'prosemirror-model'
import {
  liftListItem,
  sinkListItem,
  splitListItem,
  wrapInList,
} from 'prosemirror-schema-list'
import { Command } from 'prosemirror-state'

import { Dispatch } from '../commands'
import { EditorAction } from '../types'

// TODO:: remove this command when quarterback start supporting list_item and the operation on the list

const ignoreTrackChanges =
  (command: Command) => (state: ManuscriptEditorState, dispatch?: Dispatch) => {
    command(state, (tr) => {
      if (dispatch) {
        tr.setMeta('track-changes-skip-tracking', true)
        dispatch(tr)
      }
    })
    return true
  }
// TODO:: remove this command when quarterback start supporting list_item and the operation on the list
// this command is for fixing the issue of unlisting the first-level item when clicking on shift-tab
const contraolLiftListItem =
  (nodeType: NodeType): EditorAction =>
  (state, dispatch) => {
    const { $from } = state.selection
    const listItem = $from.node($from.depth - 1)

    //the minimum depth of the first-level (un-nested) list item is 5
    const isNested = listItem && listItem.type === nodeType && $from.depth > 5

    if (isNested) {
      return liftListItem(nodeType)(state, dispatch)
    } else {
      return false
    }
  }
const listKeymap: { [key: string]: EditorAction } = {
  Enter: splitListItem(schema.nodes.list_item),
  'Mod-[': liftListItem(schema.nodes.list_item),
  'Mod-]': sinkListItem(schema.nodes.list_item),
  'Mod-Alt-o': wrapInList(schema.nodes.ordered_list),
  'Mod-Alt-k': wrapInList(schema.nodes.bullet_list),
  'Shift-Tab': ignoreTrackChanges(contraolLiftListItem(schema.nodes.list_item)),
  Tab: ignoreTrackChanges(sinkListItem(schema.nodes.list_item)), // indent, same as Mod-]
}

export default listKeymap
