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
import { ManuscriptEditorView } from '@manuscripts/transform'
import { Fragment, Node, Schema, Slice } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'
import { ContentNodeWithPos } from 'prosemirror-utils'

export const createTableFromSlice = (
  slice: Slice,
  schema: Schema
): Node | null => {
  const rows: Node[] = []
  slice.content.forEach((node: Node) => {
    if (node.type === schema.nodes.table_row) {
      rows.push(node)
    } else if (node.type === schema.nodes.table_cell) {
      rows.push(schema.nodes.table_row.create(null, Fragment.from(node)))
    }
  })

  if (rows.length > 0) {
    return schema.nodes.table.create(null, rows)
  }

  return null
}

export const handleTableSlice = (view: ManuscriptEditorView, cutDepth: number, tableElement: ContentNodeWithPos) => {
      const { node, pos } = tableElement
      // Dispatch a transaction to update the selection to include the whole table_element
      view.dispatch(
        view.state.tr.setSelection(
          TextSelection.create(
            view.state.doc,
            pos,
            pos + node.nodeSize
          )
        )
      )
      return new Slice(Fragment.from(node), cutDepth, cutDepth)
}