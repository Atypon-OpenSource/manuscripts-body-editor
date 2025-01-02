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
import { ManuscriptNode, schema } from '@manuscripts/transform'
import { Fragment } from 'prosemirror-model'
import { EditorState, Plugin, TextSelection } from 'prosemirror-state'
import { CellSelection, selectedRect } from 'prosemirror-tables'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'

import { isTextSelection } from '../commands'

/**
 * This plugins fixes cursos jump caused by tables-fixes plugin from prosemirror tables
 * also will include table_element node with the selection, if the selection start/end from table node
 */
export default () => {
  return new Plugin<null>({
    appendTransaction: (transactions, oldState, newState) => {
      if (
        isTextSelection(newState.selection) &&
        !oldState.selection.eq(newState.selection)
      ) {
        const slice = newState.selection.$from.doc.slice(
          newState.selection.from,
          newState.selection.to
        )
        const selectionTable = getTable(slice.content)
        const selection = addTableElementToSelection(newState, selectionTable)
        if (selection) {
          const newTr = newState.tr
          newTr.setSelection(selection)
          return newTr
        }
      }
      if (
        isTableShapeSelected(newState) &&
        !oldState.selection.eq(newState.selection)
      ) {
        const contentNode = findParentNodeOfTypeClosestToPos(
          newState.selection.$from,
          schema.nodes.table_element
        )
        if (contentNode) {
          const newTr = newState.tr
          newTr.setSelection(
            TextSelection.create(
              newState.doc,
              contentNode.pos,
              contentNode.pos + contentNode.node.nodeSize
            )
          )
          return newTr
        }
      }

      const tablesFixedTr = transactions.find((tr) => tr.getMeta('fix-tables$'))
      if (!tablesFixedTr) {
        return null
      }

      // const pos = tablesFixedTr.selection.$anchor.pos;
      const newTr = newState.tr
      skipTracking(newTr)
      newTr.setMeta('origin', 'tables-cursor-fix')
      newTr.setSelection(
        TextSelection.create(newState.doc, tablesFixedTr.selection.$anchor.pos)
      )

      return newTr
    },
  })
}

const isTableShapeSelected = (state: EditorState) => {
  if (state.selection instanceof CellSelection) {
    const rect = selectedRect(state)
    return rect.bottom === rect.map.height && rect.right === rect.map.width
  }
  return false
}

const getTable = (fragment?: Fragment) => {
  let table: ManuscriptNode | undefined
  fragment?.descendants((node) => {
    if (node?.type === schema.nodes.table) {
      table = node
      return false
    }
  })
  return table
}

/**
 * Expand selection to include table_element node
 */
const addTableElementToSelection = (
  state: EditorState,
  selectedTable?: ManuscriptNode
) => {
  const { doc, selection } = state
  const fromContentNode = findParentNodeOfTypeClosestToPos(
    selection.$from,
    schema.nodes.table_element
  )
  const toContentNode = findParentNodeOfTypeClosestToPos(
    selection.$to,
    schema.nodes.table_element
  )
  const docTableElement = fromContentNode?.node || toContentNode?.node

  if (
    selectedTable?.nodeSize !== getTable(docTableElement?.content)?.nodeSize
  ) {
    return undefined
  }

  const from =
    ((fromContentNode && toContentNode) || fromContentNode) &&
    fromContentNode.pos
  const to =
    ((fromContentNode && toContentNode) || toContentNode) &&
    toContentNode.pos + toContentNode.node.nodeSize

  return TextSelection.create(doc, from || selection.from, to || selection.to)
}
