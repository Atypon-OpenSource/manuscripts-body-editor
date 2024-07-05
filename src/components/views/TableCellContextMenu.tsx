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
import { DeleteIcon, IconTextButton, PlusIcon } from '@manuscripts/style-guide'
import { Command } from 'prosemirror-state'
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  deleteColumn,
  deleteRow,
} from 'prosemirror-tables'
import { EditorView } from 'prosemirror-view'
import React from 'react'
import styled from 'styled-components'

export const ContextMenu: React.FC<{ view: EditorView; close: () => void }> = ({
  view,
  close,
}) => {
  const runCommand = (command: Command) => {
    command(view.state, view.dispatch)
    close()
  }

  return (
    <MenuDropdownList>
      <ActionButton onClick={() => runCommand(addRowBefore)}>
        <PlusIcon /> Insert row above
      </ActionButton>
      <ActionButton onClick={() => runCommand(addRowAfter)}>
        <PlusIcon /> Insert row below
      </ActionButton>
      <ActionButton onClick={() => runCommand(addColumnBefore)}>
        <PlusIcon /> Insert column to the left
      </ActionButton>
      <ActionButton onClick={() => runCommand(addColumnAfter)}>
        <PlusIcon /> Insert column to the right
      </ActionButton>
      <Separator />
      <ActionButton onClick={() => runCommand(deleteRow)}>
        <GrayDeleteIcon /> Delete row
      </ActionButton>
      <ActionButton onClick={() => runCommand(deleteColumn)}>
        <GrayDeleteIcon /> Delete column
      </ActionButton>
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
