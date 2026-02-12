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
  MultiValueInput,
  PrimaryButton,
  SearchIcon,
  SecondaryButton,
  TextField,
  FormRow,
  Label,
  Theme,
  ButtonGroup,
} from '@manuscripts/style-guide'
import { Field, FieldProps, Formik, FormikProps } from 'formik'
import React, { useMemo, useRef } from 'react'
import styled, { useTheme } from 'styled-components'
import { debounce } from 'lodash'

import { AwardAttrs } from '../../views/award'
import { ChangeHandlingForm } from '../ChangeHandlingForm'
import {
  ControlProps,
  OptionProps,
  components,
  StylesConfig,
  InputActionMeta,
  InputProps,
  SingleValue,
} from 'react-select'
import AsyncCreatableSelect from 'react-select/async-creatable'

export interface AwardFormProps {
  values: AwardAttrs
  onSave: (values: AwardAttrs) => void
  onCancel: () => void
  onChange: (values: AwardAttrs) => void
}

interface Funder {
  id: string
  location: string
  name: string
  'alt-names': string[]
  uri: string
  replaces: string[]
  'replaced-by': string[]
  tokens: string[]
}

interface FunderOption {
  value: string
  label: string
}

const loadOptions = async (inputValue: string): Promise<FunderOption[]> => {
  try {
    const formattedQuery = inputValue.replace(/\s+/g, '+')
    const response = await fetch(
      `https://api.crossref.org/funders?query=${encodeURIComponent(formattedQuery)}`
    )
    if (!response.ok) {
      console.log(`HTTP error! status: ${response.status}`)
      return []
    }
    const data = await response.json()
    const funderOptions: FunderOption[] = data.message.items.map(
      (funder: Funder) => ({
        value: funder.name,
        label: funder.name,
      })
    )
    return funderOptions.sort((a, b) => a.label.localeCompare(b.label))
  } catch (e) {
    console.error('Error fetching funders:', e)
    return []
  }
}

export const AwardForm = ({
  values,
  onSave,
  onCancel,
  onChange,
}: AwardFormProps) => {
  const formRef = useRef<FormikProps<AwardAttrs>>(null)
  const primaryButtonText = values.source ? 'Update funder' : 'Add funder'

  const themes = useTheme() as Theme
  const customStyles = useMemo(() => getCustomStyles(themes), [themes])
  const handleOnLoadFunders = debounce(loadOptions, 300)

  const handleCancel = () => {
    formRef.current?.resetForm()
    onCancel()
  }

  const handleInputChange = (value: string, action: InputActionMeta) => {
    if (action.action === 'input-change') {
      formRef.current?.setFieldValue('source', value)
    }
  }

  const validate = (values: AwardAttrs) => {
    const errors: Partial<AwardAttrs> = {} // Object to hold validation errors
    if (!values.source) {
      errors.source = 'Funder name is required'
    }
    return errors // Return errors object to Formik
  }

  return (
    <Formik<AwardAttrs>
      initialValues={values}
      onSubmit={(values, { setSubmitting }) => {
        onSave(values)
        setSubmitting(false)
      }}
      enableReinitialize={true}
      validate={validate}
      validateOnChange={false}
      innerRef={formRef}
    >
      {(formik) => {
        return (
          <ChangeHandlingForm onChange={onChange}>
            <Field type="hidden" name="id" />

            <FormRow>
              <Label htmlFor={'source'}>Funder name</Label>
              <Field name="source">
                {(props: FieldProps) => (
                  <AsyncCreatableSelect<FunderOption>
                    loadOptions={handleOnLoadFunders}
                    onInputChange={handleInputChange}
                    onChange={(option: SingleValue<FunderOption>) =>
                      option &&
                      formRef.current?.setFieldValue('source', option.value)
                    }
                    inputValue={props.field.value}
                    value={null}
                    isValidNewOption={() => false}
                    components={{
                      Input,
                      Control,
                      Option,
                      DropdownIndicator: null,
                      IndicatorSeparator: null,
                    }}
                    styles={customStyles}
                    placeholder="Search for funder..."
                  />
                )}
              </Field>
              {formik.errors.source && formik.touched.source && (
                <ErrorText>{formik.errors.source}</ErrorText>
              )}
            </FormRow>

            <FormRow>
              <Label htmlFor={'code'}>Grant number</Label>
              <MultiValueInput
                id="code"
                inputType="text"
                placeholder="Enter grant number and press enter"
                initialValues={values.code ? values.code.split(';') : []}
                onChange={(newValues) => {
                  formik.setFieldValue('code', newValues.join(';'))
                }}
              />
            </FormRow>

            <FormRow>
              <Label htmlFor={'recipient'}>Recipient name</Label>
              <Field name="recipient">
                {(props: FieldProps) => (
                  <TextField
                    id="recipient"
                    placeholder="Enter full name"
                    {...props.field}
                  />
                )}
              </Field>
            </FormRow>

            <FormRow>
              <FormActions>
                <SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
                <PrimaryButton
                  type="submit"
                  disabled={!formik.dirty || formik.isSubmitting}
                >
                  {primaryButtonText}
                </PrimaryButton>
              </FormActions>
            </FormRow>
          </ChangeHandlingForm>
        )
      }}
    </Formik>
  )
}
// TODO:: All that react-select component and styles should be in style-guide with a standard select component

const SearchIconContainer = styled.span<{ isFocused: boolean }>`
  display: flex;
  align-items: center;
  padding-left: ${(props) => props.theme.grid.unit * 4}px;
  padding-right: ${(props) => props.theme.grid.unit * 2}px;

  path {
    stroke: ${(props) =>
      props.isFocused
        ? props.theme.colors.brand.medium
        : props.theme.colors.text.primary};
  }
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

const Option: React.FC<OptionProps<FunderOption, false>> = ({
  innerProps,
  innerRef,
  data,
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

const Control = ({ children, ...props }: ControlProps<FunderOption, false>) => {
  return (
    <components.Control {...props}>
      <SearchIconContainer isFocused={props.isFocused}>
        <SearchIcon />
      </SearchIconContainer>
      {children}
    </components.Control>
  )
}
// this to prevent clearing text input from selected option ISSUE:
// https://github.com/JedWatson/react-select/issues/2296
const Input = (props: InputProps<FunderOption, false>) => (
  <components.Input {...props} isHidden={false} />
)

const getCustomStyles = (theme: Theme): StylesConfig<FunderOption, false> => ({
  control: (provided, state) => ({
    ...provided,
    minHeight: '40px',
    borderRadius: '4px',
    border: `${state.isFocused ? '2px' : '1px'} solid ${state.isFocused ? theme.colors.brand.default : theme.colors.border.secondary}`,
    backgroundColor:
      state.isFocused || state.menuIsOpen
        ? theme.colors.background.fifth
        : theme.colors.background.primary,
    boxShadow: 'none',
    cursor: 'text',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: theme.colors.background.fifth,
    },
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
    color: theme.colors.text.primary,
    fontSize: theme.font.size.normal,
    fontFamily: theme.font.family.sans,
  }),
  placeholder: (provided, state) => ({
    ...provided,
    margin: 0,
    fontStyle: 'italic',
    color: state.isFocused ? '#c9c9c9' : theme.colors.text.secondary,
    fontSize: theme.font.size.medium,
    fontFamily: theme.font.family.sans,
    fontWeight: theme.font.weight.normal,
    lineHeight: theme.font.lineHeight.large,
  }),
})

const FormActions = styled(ButtonGroup)`
  margin: ${(props) => props.theme.grid.unit * 2}px;
`

const ErrorText = styled.div`
  color: ${(props) => props.theme.colors.text.error};
  font-size: ${(props) => props.theme.font.size.small};
  margin-top: 4px;
`
