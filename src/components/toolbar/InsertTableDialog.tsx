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
  CheckboxField,
  CheckboxLabel,
  Dialog,
} from '@manuscripts/style-guide'
import { ManuscriptEditorState } from '@manuscripts/transform'
import React, { useState } from 'react'
import Select, { OptionProps } from 'react-select'
import styled from 'styled-components'

import { Dispatch, insertTable } from '../../commands'
import { getEditorProps } from '../../plugins/editor-props'
import ReactSubView from '../../views/ReactSubView'

const Label = styled.div`
  padding-right: 16px;
  width: 150px;
`
const SelectContainer = styled.div`
  width: 182px;
  height: 30px;
`

const Container = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 16px;
`
const OptionWrapper = styled.div<{ focused?: boolean; selected?: boolean }>`
  padding-left: ${(props) => props.theme.grid.unit * 4}px;
  padding-top: ${(props) => props.theme.grid.unit * 2}px;
  padding-bottom: ${(props) => props.theme.grid.unit * 2}px;

  background-color: ${(props) => {
    if (props.selected) {
      return props.theme.colors.background.selected
    }
    if (props.focused) {
      return props.theme.colors.background.fifth
    }
    return 'transparent'
  }};

  &:hover {
    background-color: ${(props) => props.theme.colors.background.fifth};
  }
`

export type InsertTableDialogProps = {
  state: ManuscriptEditorState
  dispatch?: Dispatch
}

export const InsertTableDialog: React.FC<InsertTableDialogProps> = ({
  state,
  dispatch,
}) => {
  const [isOpen, setOpen] = useState(true)
  const [numberOfColumns, setNumColumns] = useState({ value: 4, label: `4` })
  const [numberOfRows, setNumRows] = useState({ value: 4, label: `4` })
  const [includeHeader, setIncludeHeader] = useState(true)

  type OptionType = { value: number; label: string }

  const handleColumnChange = (newValue: OptionType) => {
    setNumColumns(newValue)
  }

  const handleRowChange = (newValue: OptionType) => {
    setNumRows(newValue)
  }

  const options: OptionType[] = Array.from({ length: 20 }, (_, index) => ({
    value: index + 1,
    label: `${index + 1}`,
  }))

  const OptionComponent: React.FC<OptionProps<OptionType, false>> = ({
    innerProps,
    data,
    innerRef,
    isFocused,
    isSelected,
  }) => {
    return (
      <OptionWrapper
        {...innerProps}
        ref={innerRef}
        focused={isFocused}
        selected={isSelected}
      >
        {data.label}
      </OptionWrapper>
    )
  }

  const actions = {
    primary: {
      action: () => {
        const config = {
          numberOfColumns: numberOfColumns.value,
          numberOfRows: numberOfRows.value,
          includeHeader,
        }
        insertTable(config, state, dispatch)
        setOpen(false)
      },
      title: 'Create table',
    },
    secondary: {
      action: () => setOpen(false),
      title: 'Cancel',
    },
  }

  return (
    <Dialog
      isOpen={isOpen}
      actions={actions}
      category={Category.confirmation}
      header={'Insert table'}
      message={''}
    >
      <Container>
        <Label>Number of columns:</Label>
        <SelectContainer>
          <Select<OptionType>
            onChange={(v) => handleColumnChange(v as OptionType)}
            value={numberOfColumns}
            options={options}
            components={{
              Option: OptionComponent,
            }}
            menuPosition="fixed"
            maxMenuHeight={150}
          />
        </SelectContainer>
      </Container>
      <Container>
        <Label>Number of rows:</Label>
        <SelectContainer>
          <Select<OptionType>
            onChange={(v) => handleRowChange(v as OptionType)}
            value={numberOfRows}
            options={options}
            components={{
              Option: OptionComponent,
            }}
            menuPosition="fixed"
            maxMenuHeight={150}
          />
        </SelectContainer>
      </Container>
      <CheckboxLabel>
        <CheckboxField
          name={'include-header'}
          checked={includeHeader}
          onChange={(e) => {
            setIncludeHeader(e.target.checked)
          }}
        />
        <div>Include header row</div>
      </CheckboxLabel>
    </Dialog>
  )
}

export const openInsertTableDialog = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const props = getEditorProps(state)

  const componentProps: InsertTableDialogProps = {
    state,
    dispatch,
  }

  const dialog = ReactSubView(
    props,
    InsertTableDialog,
    componentProps,
    state.doc,
    //@ts-ignore
    null,
    //@ts-ignore
    null
  )

  document.body.appendChild(dialog)
}
