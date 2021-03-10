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
import React from 'react'
import styled from 'styled-components'

import { getSelectedTableAttr, setTableAttrs } from './commands'
import { Modal } from './shared'
import { Props } from './types'

const FormStyled = styled.form`
  display: flex;
  flex-direction: row;
`

const Field = styled.div`
  flex: 1 0 auto;
  width: 50%;
`

const LabelStyled = styled.label`
  font-weight: bold;
  display: block;
`

interface State {
  id: string
  headerRows: number
  footerRows: number
}

const TableOptions: React.FC<Props> = ({
  editorState,
  handleCloseDialog,
  dispatch,
}) => {
  return (
    <Modal<State>
      handleCloseDialog={handleCloseDialog}
      editorState={editorState}
      dispatch={dispatch}
      selector={getSelectedTableAttr}
      command={setTableAttrs}
      header="Configure the Selected Table"
    >
      {({ state, handleChange }) => (
        <FormStyled>
          <Field>
            <LabelStyled htmlFor="headerRows">Num Header Rows</LabelStyled>
            <input
              id="headerRows"
              type="number"
              min="0"
              max="5"
              value={state.headerRows}
              onChange={(e) => handleChange('headerRows', e.target.value)}
            />
          </Field>
          <Field>
            <LabelStyled htmlFor="footerRows">Num Footer Rows</LabelStyled>
            <input
              id="footerRows"
              type="number"
              min="0"
              max="5"
              value={state.footerRows}
              onChange={(e) => handleChange('footerRows', e.target.value)}
            />
          </Field>
        </FormStyled>
      )}
    </Modal>
  )
}

export default TableOptions
