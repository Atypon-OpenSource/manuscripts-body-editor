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
} from '@manuscripts/style-guide'
import { Field, FieldProps, Formik, FormikProps } from 'formik'
import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { AwardAttrs } from '../../views/award'
import { ChangeHandlingForm } from '../ChangeHandlingForm'
import { useDebounce } from '../hooks/use-debounce'

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

export const AwardForm = ({
  values,
  onSave,
  onCancel,
  onChange,
}: AwardFormProps) => {
  const [funders, setFunders] = useState<FunderOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const formRef = useRef<FormikProps<AwardAttrs>>(null)
  const primaryButtonText = values.source ? 'Update funder' : 'Add funder'

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    const searchFunders = async () => {
      const query = debouncedSearchQuery
      if (!query) {
        setFunders([])
        return
      }

      setIsLoading(true)
      try {
        const formattedQuery = query.replace(/\s+/g, '+')
        const response = await fetch(
          `https://api.crossref.org/funders?query=${encodeURIComponent(
            formattedQuery
          )}`
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        const funderOptions: FunderOption[] = data.message.items.map(
          (funder: Funder) => ({
            value: funder.name,
            label: funder.name,
          })
        )
        funderOptions.sort((a, b) => a.label.localeCompare(b.label))
        setFunders(funderOptions)
      } catch (error) {
        console.error('Error fetching funders:', error)
        setFunders([])
      } finally {
        setIsLoading(false)
      }
    }

    searchFunders()
  }, [debouncedSearchQuery])

  const handleFunderSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleCancel = () => {
    formRef.current?.resetForm()
    onCancel()
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
            <LabelContainer>
              <Label htmlFor={'source'}>Funder name</Label>
            </LabelContainer>
            <SearchContainer>
              <SearchIconContainer>
                <SearchIcon />
              </SearchIconContainer>
              <Field name="source">
                {(props: FieldProps) => (
                  <StyledTextField
                    id="source"
                    placeholder="Search for funder..."
                    onChange={(e) => {
                      props.field.onChange(e)
                      handleFunderSearch(e)
                    }}
                    value={props.field.value || ''}
                    autoFocus={true}
                  />
                )}
              </Field>
              {isLoading && <LoadingText>Loading...</LoadingText>}
              {funders.length > 0 && (
                <SearchResults>
                  {funders.map((funder) => (
                    <SearchResultItem
                      key={funder.value}
                      onClick={() => {
                        formik.setFieldValue('source', funder.value)
                        setFunders([])
                      }}
                    >
                      {funder.label}
                    </SearchResultItem>
                  ))}
                </SearchResults>
              )}
            </SearchContainer>
            {formik.errors.source && formik.touched.source && (
              <ErrorText>{formik.errors.source}</ErrorText>
            )}
            <LabelContainer>
              <Label htmlFor={'code'}>Grant number</Label>
            </LabelContainer>
            <MultiValueInput
              id="code"
              inputType="text"
              placeholder="Enter grant number and press enter"
              initialValues={values.code ? values.code.split(';') : []}
              onChange={(newValues) => {
                formik.setFieldValue('code', newValues.join(';'))
              }}
            />
            <LabelContainer>
              <Label htmlFor={'recipient'}>Recipient name</Label>
            </LabelContainer>
            <Field name="recipient">
              {(props: FieldProps) => (
                <TextField
                  id="recipient"
                  placeholder="Enter full name"
                  {...props.field}
                />
              )}
            </Field>

            <ButtonContainer>
              <SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
              <PrimaryButton
                type="submit"
                disabled={!formik.dirty || formik.isSubmitting}
              >
                {primaryButtonText}
              </PrimaryButton>
            </ButtonContainer>
          </ChangeHandlingForm>
        )
      }}
    </Formik>
  )
}

const LabelContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${(props) => 4 * props.theme.grid.unit}px;
  margin-bottom: ${(props) => props.theme.grid.unit}px;
`

const Label = styled.label`
  font-family: ${(props) => props.theme.font.family.sans};
  font-size: ${(props) => props.theme.font.size.large};
  display: block;
  color: ${(props) => props.theme.colors.text.secondary};
`

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  gap: 8px;
`

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`

const SearchIconContainer = styled.span`
  display: flex;
  left: ${(props) => props.theme.grid.unit * 4}px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;

  path {
    stroke: ${(props) => props.theme.colors.text.primary};
  }

  ${SearchContainer}:hover &,
  ${SearchContainer}:focus-within & {
    path {
      stroke: ${(props) => props.theme.colors.brand.medium};
    }
  }
`

const StyledTextField = styled(TextField)`
  padding-left: ${(props) => props.theme.grid.unit * 11}px;
  &:hover,
  &:focus {
    background-color: ${(props) => props.theme.colors.background.fifth};
  }
`

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid ${(props) => props.theme.colors.border.secondary};
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`

const SearchResultItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  &:hover {
    background-color: ${(props) => props.theme.colors.background.fifth};
  }
`

const LoadingText = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${(props) => props.theme.colors.text.secondary};
  font-size: ${(props) => props.theme.font.size.small};
`

const ErrorText = styled.div`
  color: ${(props) => props.theme.colors.text.error};
  font-size: ${(props) => props.theme.font.size.small};
  margin-top: 4px;
`
