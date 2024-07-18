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
  ColumnChangeWarningDialog,
  DeleteIcon,
  IconTextButton,
  PlusIcon,
} from '@manuscripts/style-guide'
import { skipTracking } from '@manuscripts/track-changes-plugin'
import { Command, EditorState } from 'prosemirror-state'
import {
  addColumnAfter,
  addColumnBefore,
  CellSelection,
  deleteColumn,
  deleteRow,
  selectedRect,
} from 'prosemirror-tables'
import { EditorView } from 'prosemirror-view'
import React, { useState } from 'react'
import styled from 'styled-components'

import { addRows } from '../../commands'

/**
 * Return the number of selected rows/columns
 */
const getSelectedCells = (state: EditorState) => {
  const { selection } = state
  const selectedCells = { rows: 1 }
  if (selection instanceof CellSelection) {
    const rect = selectedRect(state)
    selectedCells.rows = rect.bottom - rect.top
  }
  return selectedCells
}

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

  const [columnAction, setColumnAction] = useState<Command | undefined>(
    undefined
  )

  const { rows } = getSelectedCells(view.state)

  return (
    <MenuDropdownList>
      <ActionButton onClick={() => runCommand(addRows('top'))}>
        <PlusIcon /> Insert row above {rows > 1 && rows}
      </ActionButton>
      <ActionButton onClick={() => runCommand(addRows('bottom'))}>
        <PlusIcon /> Insert row below {rows > 1 && rows}
      </ActionButton>
      <ActionButton onClick={() => setColumnAction(() => addColumnBefore)}>
        <PlusIcon /> Insert column to the left
      </ActionButton>
      <ActionButton onClick={() => setColumnAction(() => addColumnAfter)}>
        <PlusIcon /> Insert column to the right
      </ActionButton>
      <Separator />
      <ActionButton onClick={() => runCommand(deleteRow)}>
        <GrayDeleteIcon /> Delete row {rows > 1 && rows}
      </ActionButton>
      <ActionButton onClick={() => setColumnAction(() => deleteColumn)}>
        <GrayDeleteIcon /> Delete column
      </ActionButton>

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
