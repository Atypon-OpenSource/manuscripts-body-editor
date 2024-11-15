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

// TODO: checking the ability to remove the following logic, after the following ticket LEAN-4118 is resolved
export const transformCopied = (slice: Slice, view: EditorView): Slice => {
  const { state } = view
  const cutDepth = Math.min(slice.openStart, slice.openEnd)
  const tableSlice = handleTableSelection(slice, view, cutDepth)
  if (tableSlice) {
    return tableSlice
  }
  if (
    slice.content.firstChild?.type.isBlock ||
    slice.content.lastChild?.type.isBlock
  ) {
    let newSliceContent: ManuscriptNode[] = []
    slice.content.firstChild?.descendants((node) => {
      if (
        node.childCount > 1 ||
        (node.content.firstChild?.type === schema.nodes.table_element &&
          node.content.lastChild?.type === schema.nodes.table_element)
      ) {
        newSliceContent = updateSliceWithFullTableContent(state, node.content)
        return false
      }
      return true
    })
    if (newSliceContent.length > 1) {
      return new Slice(Fragment.from(newSliceContent), 0, 0)
    } else {
      const updateSelection = handleTableSelection(
        new Slice(
          Fragment.from(newSliceContent),
          slice.openStart,
          slice.openEnd
        ),
        view,
        0
      )
      if (updateSelection) {
        return updateSelection
      }
    }
  }
  return slice
}

const handleTableSelection = (
  slice: Slice,
  view: EditorView,
  cutDepth: number
): Slice | null => {
  if (
    (!view.props.handleKeyDown || !view.state.selection.empty) &&
    (slice.content.firstChild?.type === schema.nodes.table ||
      slice.content.firstChild?.type === schema.nodes.table_element)
  ) {
    // Find the table_element node that contains the copied content
    const tableElement = findParentNodeOfType(schema.nodes.table_element)(
      view.state.selection
    )
    if (tableElement) {
      return handleTableSlice(view, cutDepth, tableElement)
    }
  }
  return null
}
