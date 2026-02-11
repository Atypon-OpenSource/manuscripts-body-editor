/*!
 * © 2025 Atypon Systems LLC
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
  ArrowDownIcon,
  IconButton,
  outlineStyle,
  SecondaryIconButton,
  TextArea,
  TextField,
} from '@manuscripts/style-guide'
import { Field } from 'formik'
import styled from 'styled-components'

export const LabelContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.grid.unit}px;
`

export const Label = styled.label`
  font-family: ${(props) => props.theme.font.family.sans};
  font-size: ${(props) => props.theme.font.size.medium};
  display: flex;
  color: ${(props) => props.theme.colors.text.secondary};
`

export const FieldLabel = styled.label`
  font-family: ${(props) => props.theme.font.family.sans};
  font-size: ${(props) => props.theme.font.size.medium};
  color: ${(props) => props.theme.colors.text.muted};
  padding-right: ${(props) => props.theme.grid.unit * 3}px;
`

export const NameFieldContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${(props) => props.theme.colors.background.primary};
  :not(:last-child) {
    border-bottom: 1px solid ${(props) => props.theme.colors.text.muted};
  }
`

export const NameField = styled.input`
  font-size: ${(props) => props.theme.font.size.normal};
  padding: ${(props) => props.theme.grid.unit * 2}px
    ${(props) => props.theme.grid.unit * 4}px;
  box-sizing: border-box;
  border: none;
  background-color: transparent;
  width: 50%;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${(props) => props.theme.colors.text.muted};
  }

  &:hover::placeholder {
    color: ${(props) => props.theme.colors.text.secondary};
  }
`

export const YearField = styled(Field)`
  font-family: ${(props) => props.theme.font.family.sans};
  padding: ${(props) => props.theme.grid.unit * 2}px
    ${(props) => props.theme.grid.unit * 3}px;
  font-size: ${(props) => props.theme.font.size.medium};
  color: ${(props) => props.theme.colors.text.primary};
  border-radius: ${(props) => props.theme.grid.radius.small};
  border: solid 1px ${(props) => props.theme.colors.text.muted};
`

export const Button = styled(IconButton).attrs({
  defaultColor: true,
  size: 24,
})`
  circle,
  use {
    fill: ${(props) => props.theme.colors.brand.default};
  }

  path {
    mask: none;
  }
`

export const Actions = styled.div`
  flex-shrink: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .tooltip {
    max-width: ${(props) => props.theme.grid.unit * 39}px;
    padding: ${(props) => props.theme.grid.unit * 2}px;
    border-radius: 6px;
  }
`

export const FormField = styled.div`
  padding: ${(props) => props.theme.grid.unit * 3}px;
`

export const ReferenceTextField = styled(TextField)`
  padding: ${(props) => props.theme.grid.unit * 2}px
    ${(props) => props.theme.grid.unit * 3}px;
`

export const ReferenceTextArea = styled(TextArea)`
  padding: ${(props) => props.theme.grid.unit * 2}px
    ${(props) => props.theme.grid.unit * 3}px;
  height: ${(props) => props.theme.grid.unit * 20}px;
  resize: none;
`

export const FormFields = styled.div`
  flex: 1;
  overflow-y: auto;
`

export const DeleteButton = styled(IconButton)`
  background-color: ${(props) =>
    props.theme.colors.background.primary} !important;
  border-color: ${(props) => props.theme.colors.background.primary} !important;
  .icon_element {
    fill: ${(props) => (props.disabled && '#c9c9c9') || '#F35143'} !important;
  }
`

export const Section = styled.section`
  border: 1px solid ${(props) => props.theme.colors.border.field.default};
  border-radius: ${(props) => props.theme.grid.radius.default};
  background: ${(props) => props.theme.colors.background.primary};
  margin-bottom: ${(props) => props.theme.grid.unit * 3}px;
  overflow: hidden;
`

export const PersonForm = styled(Section)`
  margin: ${(props) => props.theme.grid.unit * 3}px;
`

export const Title = styled.h4<{
  isInvalid?: boolean
}>`
  margin: 0;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  padding-right: 0.5rem;
  background: ${(props) =>
    props.isInvalid ? props.theme.colors.background.warning : 'transparent'};
  color: ${(props) =>
    props.isInvalid ? props.theme.colors.text.warning : 'inherit'};
`

export const DropdownIndicator = styled(ArrowDownIcon)`
  border: 0;
  border-radius: 50%;
  margin-right: 0.6em;
  min-width: 20px;
`

export const ToggleButton = styled.button<{
  isOpen: boolean
}>`
  flex-grow: 1;
  display: flex;
  align-items: center;
  width: 100%;
  background: transparent;
  border: none;
  text-align: left;
  font-family: ${(props) => props.theme.font.family.sans};
  font-size: 1rem;
  margin: 0.6em;

  outline: none;

  &:focus {
    color: ${(props) => props.theme.colors.button.primary.border.hover};
  }

  svg {
    transform: ${(props) => (props.isOpen ? 'rotateX(180deg)' : 'initial')};
  }
  ${outlineStyle}
`

export const RemoveButton = styled(SecondaryIconButton)`
  border: none;
  background: transparent;
  padding: 0;
  outline: none;
  svg {
    path[fill='white'] {
      fill: white;
    }
    rect[fill],
    path:not([fill='white']) {
      fill: #f35143;
    }
  }
`
