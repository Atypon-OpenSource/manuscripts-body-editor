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
import { TableCellStyles } from '@manuscripts/manuscript-transform'
import { Color } from '@manuscripts/manuscripts-json-schema'
import { ColorField } from '@manuscripts/style-guide'
import React, { useCallback } from 'react'
import styled from 'styled-components'

import { getSelectedTableCellStyles, setTableCellStyles } from './commands'
import { Modal } from './shared'
import { Props } from './types'

const LabelStyled = styled.label`
  font-weight: bold;
  display: block;
`

const TableCellOptions: React.FC<Props> = ({
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
    <Modal<TableCellStyles>
      handleCloseDialog={handleCloseDialog}
      selector={getSelectedTableCellStyles}
      command={setTableCellStyles}
      editorState={editorState}
      dispatch={dispatch}
      header="Configure the Selected Table Cells"
    >
      {({ state, handleChange }) => (
        <form>
          <LabelStyled htmlFor="backgroundColor">Background Color</LabelStyled>
          <ColorField
            options={setColors}
            value={state.backgroundColor || ''}
            handleChange={(hex) => {
              handleChange('backgroundColor', hex || '')
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

export default TableCellOptions
