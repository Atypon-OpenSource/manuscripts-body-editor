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
  SecondaryButton,
  SelectField,
  TextField,
} from '@manuscripts/style-guide'
import { Field, FieldProps, Formik, FormikProps } from 'formik'
import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { AwardAttrs } from '../../views/award'
import { ChangeHandlingForm } from '../ChangeHandlingForm'

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
  const [funders, setFunders] = useState<FunderOption[]>([]) // State to hold funder options
  const formRef = useRef<FormikProps<AwardAttrs>>(null)
  const primaryButtonText = values.source ? 'Update funder' : 'Add funder'

  // Fetch funders only once, caching them for future use
  useEffect(() => {
    const fetchFunders = async () => {
      try {
        const response = await fetch('https://api.crossref.org/funders')
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
        // Cache the funders data
        sessionStorage.setItem('funders', JSON.stringify(funderOptions))
        setFunders(funderOptions)
      } catch (error) {
        console.error('Error fetching funders:', error)
      }
    }

    // Check if funders are already cached in sessionStorage
    const storedFunders = sessionStorage.getItem('funders')
    if (storedFunders) {
      setFunders(JSON.parse(storedFunders))
    } else {
      fetchFunders()
    }
  }, []) // Only run on mount

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
      initialValues={{
        ...values,
        source: funders.some((funder) => funder.value === values.source)
          ? values.source
          : '',
      }}
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
            <Field
              name="source"
              component={SelectField}
              options={funders}
              value={
                funders.find(
                  (funder) => funder.value === formik.values.source
                ) || ''
              }
            />
            {formik.errors.source && formik.touched.source && (
              <div style={{ color: 'red' }}>{formik.errors.source}</div>
            )}
            <LabelContainer>
              <Label htmlFor={'code'}>Grant number</Label>
            </LabelContainer>
            <MultiValueInput
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
                  placeholder="Enter full name "
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
