/*!
 * © 2021 Atypon Systems LLC
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
import { Color } from '@manuscripts/json-schema'
import { ColorField } from '@manuscripts/style-guide'
import React, { useCallback } from 'react'
import styled from 'styled-components'

import { setTableCellBorderStyles } from './commands'
import { Modal } from './shared'
import { Props } from './types'

const LabelStyled = styled.label`
  font-weight: bold;
  display: block;
`

export interface TableCellBorderParams {
  direction: 'all' | 'top' | 'bottom' | 'left' | 'right'
  width: number
  color: string
}

const initialState = (): TableCellBorderParams => ({
  direction: 'all',
  width: 1,
  color: '#000',
})

const TableCellBorderOptions: React.FC<Props> = ({
  editorState,
  handleCloseDialog,
  dispatch,
  colors,
  handleAddColor,
}) => {
  const setColors = colors.filter((color) => color.value) as Array<
    Color & { value: string }
  >
  const colorExists = useCallback(
    (hex?: string) => setColors.find((color) => color.value === hex),
    [setColors]
  )
  return (
    <Modal<TableCellBorderParams>
      handleCloseDialog={handleCloseDialog}
      selector={initialState}
      command={setTableCellBorderStyles}
      editorState={editorState}
      dispatch={dispatch}
      header="Configure the Cell Borders"
    >
      {({ state, handleChange }) => (
        <form>
          <LabelStyled htmlFor="direction">Apply to</LabelStyled>
          <select
            id="direction"
            value={state.direction}
            onChange={(e) => handleChange('direction', e.target.value)}
          >
            <option value="all">All</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
          <LabelStyled htmlFor="width">Width (px)</LabelStyled>
          <input
            id="width"
            type="number"
            min="0"
            max="5"
            value={state.width}
            onChange={(e) => handleChange('width', e.target.value)}
          />
          <LabelStyled htmlFor="backgroundColor">Border Color</LabelStyled>
          <ColorField
            options={setColors}
            value={state.color}
            handleChange={(hex) => {
              handleChange('color', hex || '')
              if (hex && !colorExists(hex)) {
                handleAddColor(hex)
              }
            }}
          />
        </form>
      )}
    </Modal>
  )
}

export default TableCellBorderOptions
