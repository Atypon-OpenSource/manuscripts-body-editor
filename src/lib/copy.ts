/*!
 * © 2024 Atypon Systems LLC
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
import { ManuscriptNode, schema } from '@manuscripts/transform'
import { Fragment, Slice } from 'prosemirror-model'
import { findParentNodeOfType } from 'prosemirror-utils'
import { EditorView } from 'prosemirror-view'

import { handleTableSlice, updateSliceWithFullTableContent } from './table'

export const transformCopied = (slice: Slice, view: EditorView): Slice => {
  const { state } = view
  const cutDepth = Math.min(slice.openStart, slice.openEnd)
  if (
    (!view.props.handleKeyDown || !state.selection.empty) &&
    slice.content.firstChild?.type === schema.nodes.table
  ) {
    // Find the table_element node that contains the copied content
    const tableElement = findParentNodeOfType(schema.nodes.table_element)(
      state.selection
    )
    if (tableElement) {
      return handleTableSlice(view, cutDepth, tableElement)
    }
  }
  if (
    slice.openStart !== slice.openEnd &&
    (slice.content.firstChild?.type.isBlock ||
      slice.content.lastChild?.type.isBlock)
  ) {
    let newSliceContent: ManuscriptNode[] = []
    slice.content.firstChild?.descendants((node) => {
      if (node.childCount > 1) {
        newSliceContent = updateSliceWithFullTableContent(state, node.content)
        return false
      }
      if (newSliceContent.length > 0) {
        return false
      }
      return true
    })

    return new Slice(Fragment.from(newSliceContent), 0, 0)
  }
  return slice
}
