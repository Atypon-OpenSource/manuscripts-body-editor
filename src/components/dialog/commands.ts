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
  ManuscriptEditorState,
  ManuscriptNode,
  ManuscriptSchema,
  ManuscriptTransaction,
  TABLE_CELL_STYLES,
  TableCellNode,
  TableCellStyles,
  TableNode,
} from '@manuscripts/manuscript-transform'
import { get as _get } from 'lodash-es'
import { Command } from 'prosemirror-commands'
import { Selection } from 'prosemirror-state'
import { CellSelection, TableMap } from 'prosemirror-tables'

import { isTextSelection } from '../../commands'
import {
  isNodeOfType,
  mergeSimilarItems,
  nearestAncestor,
} from '../../lib/helpers'
import { TableCellBorderParams } from './TableCellBorderOptions'

export type Dispatch = (tr: ManuscriptTransaction) => void

export const getSelectedTableAttr = (state: ManuscriptEditorState) => {
  const { $head } = state.selection
  const tableDepth = nearestAncestor(isNodeOfType('table'))($head)

  if (!tableDepth) {
    return {
      id: '',
      headerRows: 1,
      footerRows: 1,
    }
  }

  const tableEl = $head.node(tableDepth) as TableNode

  return tableEl.attrs
}

export const setTableAttrs =
  (attrs: TableNode['attrs']) =>
  (state: ManuscriptEditorState, dispatch?: Dispatch) => {
    const { selection, tr } = state
    const { $head } = selection
    const tableDepth = nearestAncestor(isNodeOfType('table'))($head)

    if (!tableDepth) {
      return false
    }

    const tableEl = $head.node(tableDepth) as TableNode
    const start = $head.start(tableDepth)

    if (dispatch) {
      tr.setNodeMarkup(start - 1, tableEl.type, attrs, tableEl.marks)
      dispatch(tr)
    }

    return true
  }

// Returns the table cell(s) the user is intending to work with
// when attempting to format.
// In other words, given a CellSelection, returns the cells and positions
// that are selected.
// Given a TextSelection within a table cell, returns the cell
// and position containing the cursor.
const getTableCellSelection = (
  selection: Selection<ManuscriptSchema>
): Array<[TableCellNode, number]> => {
  if (selection instanceof CellSelection) {
    const nodes: Array<[TableCellNode, number]> = []

    selection.ranges.map((range) => {
      const { parent, pos } = range.$from
      if (!isNodeOfType('table_cell')) {
        return true
      }
      nodes.push([parent as TableCellNode, pos])

      return true
    })
    return nodes
  }

  if (!isTextSelection(selection)) {
    return []
  }
  const depth = nearestAncestor(isNodeOfType('table_cell'))(selection.$anchor)
  if (!depth) {
    return []
  }

  const { $anchor } = selection
  const node = $anchor.node(depth) as TableCellNode
  return [[node, $anchor.start(depth)]]
}

const getNeighbouringCells = (
  state: ManuscriptEditorState,
  cells: Array<[TableCellNode, number]>
) => {
  if (!cells.length) {
    return () => []
  }

  const $firstCell = state.doc.resolve(cells[0][1])
  const tableDepth = nearestAncestor(isNodeOfType('table'))($firstCell)
  if (!tableDepth) {
    throw new Error('Attempting to resolve cell not in table')
  }
  const table = $firstCell.node(tableDepth)
  const map = TableMap.get(table)
  const offset = $firstCell.start(tableDepth) + 1

  return (direction: 'left' | 'right' | 'top' | 'bottom') => {
    const getNeighbourPosition = (pos: number) => {
      const axis = ['top', 'bottom'].includes(direction) ? 'vert' : 'horiz'
      const dir = ['bottom', 'right'].includes(direction) ? 1 : -1
      return map.nextCell(pos - offset, axis, dir) + offset
    }

    return cells
      .map(([, pos]) => {
        const neighbourPos = getNeighbourPosition(pos)
        if (neighbourPos <= offset) {
          return null
        }

        const $neighbour = state.doc.resolve(neighbourPos)
        const neighbour = $neighbour.parent
        if (neighbour.type !== state.schema.nodes.table_cell) {
          return null
        }
        return [neighbour, neighbourPos]
      })
      .filter(Boolean) as Array<[TableCellNode, number]>
  }
}

// Given an array of Nodes and an attribute name, gets the value of that
// attribute if it is the same for every Node. Otherwise, returns null
const everyNodeAttr = (nodes: ManuscriptNode[], attr: string) => {
  const value = _get(nodes[0].attrs, attr, null) as string | null
  return nodes.every((node) => _get(node.attrs, attr, null) === value)
    ? value
    : null
}

export const getSelectedTableCellStyles = (
  state: ManuscriptEditorState
): TableCellStyles => {
  const { selection } = state
  const nodes = getTableCellSelection(selection)

  const empty: TableCellStyles = {}

  if (!nodes.length) {
    return empty
  }

  const styles = TABLE_CELL_STYLES.reduce((acc, key) => {
    const value = everyNodeAttr(
      nodes.map((node) => node[0]),
      `styles.${key}`
    )
    acc[key] = value
    return acc
  }, empty)

  return styles
}

type StyleCommand = [
  TableCellNode,
  number,
  Partial<TableCellNode['attrs']['styles']>
]
const reshapeStyleCommands = mergeSimilarItems<StyleCommand>(
  (a, b) => a[1] === b[1],
  (a, b) => {
    return [a[0], a[1], { ...a[2], ...b[2] }]
  }
)
const mapStylesToNodes = (
  nodes: Array<[TableCellNode, number]>,
  style: Partial<TableCellNode['attrs']['styles']>
): Array<
  [TableCellNode, number, Partial<TableCellNode['attrs']['styles']>]
> => {
  return nodes.map((node) => [node[0], node[1], style])
}
const applyStylesToTableCells =
  (commands: StyleCommand[]): Command =>
  (state, dispatch) => {
    const { tr } = state
    if (!commands.length) {
      return false
    }

    // reshaped cells so that each style command is only executed once
    const reshaped = reshapeStyleCommands(commands)

    reshaped.map(([node, pos, styles]) => {
      tr.setNodeMarkup(
        pos - 1,
        undefined,
        { ...node.attrs, styles: { ...node.attrs.styles, ...styles } },
        node.marks
      )
    })
    dispatch && dispatch(tr)
    return true
  }

export const setTableCellStyles =
  (styles: Partial<TableCellNode['attrs']['styles']>) =>
  (state: ManuscriptEditorState, dispatch?: Dispatch) => {
    const { selection } = state
    const nodes = getTableCellSelection(selection)
    if (!nodes.length) {
      return false
    }

    return applyStylesToTableCells(mapStylesToNodes(nodes, styles))(
      state,
      dispatch
    )
  }

export const setTableCellBorderStyles =
  ({ direction, width, color }: TableCellBorderParams) =>
  (state: ManuscriptEditorState, dispatch?: Dispatch) => {
    const { selection } = state
    const nodes = getTableCellSelection(selection)
    if (!nodes.length) {
      return false
    }

    const neighbours = getNeighbouringCells(state, nodes)
    const value = Number(width)
      ? `${width}px solid ${color}`
      : `1px solid transparent`

    let commands: StyleCommand[] = []
    if (['all', 'top'].includes(direction)) {
      commands = commands.concat(
        mapStylesToNodes(nodes, { borderTop: value }),
        mapStylesToNodes(neighbours('top'), { borderBottom: value })
      )
    }
    if (['all', 'bottom'].includes(direction)) {
      commands = commands.concat(
        mapStylesToNodes(nodes, { borderBottom: value }),
        mapStylesToNodes(neighbours('bottom'), { borderTop: value })
      )
    }
    if (['all', 'left'].includes(direction)) {
      commands = commands.concat(
        mapStylesToNodes(nodes, { borderLeft: value }),
        mapStylesToNodes(neighbours('left'), { borderRight: value })
      )
    }
    if (['all', 'right'].includes(direction)) {
      commands = commands.concat(
        mapStylesToNodes(nodes, { borderRight: value }),
        mapStylesToNodes(neighbours('right'), { borderLeft: value })
      )
    }

    return applyStylesToTableCells(commands)(state, dispatch)
  }
