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

const listKeymap: { [key: string]: EditorAction } = {
  Enter: splitListItem(schema.nodes.list_item),
  'Mod-[': liftListItem(schema.nodes.list_item),
  'Mod-]': sinkListItem(schema.nodes.list_item),
  'Mod-Alt-o': wrapInList(schema.nodes.ordered_list),
  'Mod-Alt-k': wrapInList(schema.nodes.bullet_list),
  'Shift-Tab': ignoreTrackChanges(liftListItem(schema.nodes.list_item)), // outdent, same as Mod-[
  Tab: ignoreTrackChanges(sinkListItem(schema.nodes.list_item)), // indent, same as Mod-]
}
export default listKeymap
