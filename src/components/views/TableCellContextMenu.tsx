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
import {
  Category,
  DeleteIcon,
  Dialog,
  IconTextButton,
  PlusIcon,
} from '@manuscripts/style-guide'
import { skipTracking } from '@manuscripts/track-changes-plugin'
import { Command, EditorState } from 'prosemirror-state'
import {
  CellSelection,
  deleteColumn,
  deleteRow,
  mergeCells,
  selectedRect,
  splitCell,
} from 'prosemirror-tables'
import { EditorView } from 'prosemirror-view'
import React, { useState } from 'react'
import styled from 'styled-components'

import { addColumns, addRows, mergeCellsWithSpace } from '../../commands'

/**
 * Return the number of selected rows/columns
 */
const getSelectedCellsCount = (state: EditorState) => {
  const { selection } = state
  const selectedCells = { rows: 1, columns: 1 }
  if (selection instanceof CellSelection) {
    const rect = selectedRect(state)
    selectedCells.rows = rect.bottom - rect.top
    selectedCells.columns = rect.right - rect.left
  }
  const { rows, columns } = selectedCells
  return {
    rows: rows > 1 ? `${rows} rows` : `row`,
    columns: columns > 1 ? `${columns} columns` : `column`,
  }
}

const ColumnChangeWarningDialog: React.FC<{
  isOpen: boolean
  primaryAction: () => void
  secondaryAction: () => void
}> = ({ isOpen, primaryAction, secondaryAction }) => (
  <Dialog
    isOpen={isOpen}
    category={Category.confirmation}
    header={"This change can't be tracked"}
    message="This column action won't be marked as chnage. Do you want to continue?"
    actions={{
      primary: {
        action: primaryAction,
        title: 'Ok',
      },
      secondary: {
        action: secondaryAction,
        title: 'Cancel',
      },
    }}
  />
)

export const ContextMenu: React.FC<{ view: EditorView; close: () => void }> = ({
  view,
  close,
}) => {
  const runCommand = (command: Command, noTracking?: boolean) => {
    command(view.state, (tr) =>
      view.dispatch((noTracking && skipTracking(tr)) || tr)
    )
    close()
  }

  const [columnAction, setColumnAction] = useState<Command>()

  const isCellSelectionMerged = mergeCells(view.state)
  const isCellSelectionSplittable = splitCell(view.state)
  const { rows, columns } = getSelectedCellsCount(view.state)

  return (
    <MenuDropdownList>
      <ActionButton onClick={() => runCommand(addRows('top'))}>
        <PlusIcon /> Insert {rows} above
      </ActionButton>
      <ActionButton onClick={() => runCommand(addRows('bottom'))}>
        <PlusIcon /> Insert {rows} below
      </ActionButton>
      <ActionButton onClick={() => setColumnAction(() => addColumns('left'))}>
        <PlusIcon /> Insert {columns} to the left
      </ActionButton>
      <ActionButton onClick={() => setColumnAction(() => addColumns('right'))}>
        <PlusIcon /> Insert {columns} to the right
      </ActionButton>
      <Separator />
      <ActionButton onClick={() => runCommand(deleteRow)}>
        <GrayDeleteIcon /> Delete {rows}
      </ActionButton>
      <ActionButton onClick={() => setColumnAction(() => deleteColumn)}>
        <GrayDeleteIcon /> Delete {columns}
      </ActionButton>

      {(isCellSelectionMerged || isCellSelectionSplittable) && <Separator />}
      {isCellSelectionMerged && (
        <ActionButton onClick={() => runCommand(mergeCellsWithSpace, true)}>
          Merge cells
        </ActionButton>
      )}
      {isCellSelectionSplittable && (
        <ActionButton onClick={() => runCommand(splitCell, true)}>
          Split cells
        </ActionButton>
      )}

      <ColumnChangeWarningDialog
        isOpen={!!columnAction}
        primaryAction={() => {
          if (columnAction) {
            runCommand(columnAction, true)
            setColumnAction(undefined)
          }
        }}
        secondaryAction={() => setColumnAction(undefined)}
      />
    </MenuDropdownList>
  )
}

const MenuDropdownList = styled.div`
  display: flex;
  flex-direction: column;
`

const ActionButton = styled(IconTextButton)`
  padding: 8px 16px;
  justify-content: flex-start;

  :hover {
    background: #f2fbfc;
  }
`

const Separator = styled.div`
  height: 0;
  border-bottom: 1px solid #e2e2e2;
  margin: 4px 0;
`

const GrayDeleteIcon = styled(DeleteIcon)`
  path,
  rect {
    fill: #333333;
  }
`
