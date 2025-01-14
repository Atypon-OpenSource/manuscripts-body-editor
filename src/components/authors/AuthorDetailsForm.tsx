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
  CheckboxField,
  CheckboxLabel,
  TextField,
  TextFieldGroupContainer,
  TextFieldLabel,
} from '@manuscripts/style-guide'
import { Field, FieldProps, Formik, FormikProps } from 'formik'
import React, { MutableRefObject, useEffect, useRef } from 'react'
import styled from 'styled-components'

import { ContributorAttrs } from '../../lib/authors'
import { ChangeHandlingForm } from '../ChangeHandlingForm'

export const LabelText = styled.div`
  font: ${(props) => props.theme.font.weight.normal}
    ${(props) => props.theme.font.size.normal} / 1
    ${(props) => props.theme.font.family.sans};
  letter-spacing: -0.2px;
  color: ${(props) => props.theme.colors.text.primary};
  &::before {
    margin-right: 8px !important;
  }
`

export const Fieldset = styled.fieldset`
  padding: 0;
  margin: 0;
  border: none;
`

const OrcidContainer = styled.div`
  margin: 16px 0 0;
`

const TextFieldWithError = styled(TextField)`
  &:required::placeholder {
    color: ${(props) => props.theme.colors.text.error};
  }
`

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
`

export interface FormActions {
  reset: () => void
}

interface AuthorDetailsFormProps {
  values: ContributorAttrs
  onChange: (values: ContributorAttrs) => void
  onSave: (values: ContributorAttrs) => void
  actionsRef?: MutableRefObject<FormActions | undefined>
  isEmailRequired?: boolean
  selectedAffiliations?: string[]
}

export const AuthorDetailsForm: React.FC<AuthorDetailsFormProps> = ({
  values,
  onChange,
  onSave,
  actionsRef,
  isEmailRequired,
  selectedAffiliations,
}) => {
  const formRef = useRef<FormikProps<ContributorAttrs>>(null)

  useEffect(() => {
    if (selectedAffiliations && formRef.current) {
      formRef.current.setFieldValue('affiliations', selectedAffiliations)
    }
  }, [selectedAffiliations])

  if (actionsRef && !actionsRef.current) {
    actionsRef.current = {
      reset: () => {
        formRef.current?.resetForm()
      },
    }
  }

  return (
    <Formik<ContributorAttrs>
      initialValues={values}
      onSubmit={onSave}
      enableReinitialize={true}
      validateOnChange={true}
      innerRef={formRef}
    >
      {(formik) => {
        const isAuthor = formik.values.role === 'author'
        return (
          <ChangeHandlingForm onChange={onChange}>
            <Fieldset>
              <TextFieldGroupContainer>
                <Field name={'bibliographicName.given'}>
                  {(props: FieldProps) => (
                    <TextField
                      id={'given-name'}
                      placeholder={'Given name'}
                      {...props.field}
                    />
                  )}
                </Field>

                <Field name={'bibliographicName.family'}>
                  {(props: FieldProps) => (
                    <TextField
                      id={'family-name'}
                      placeholder={'Family name'}
                      {...props.field}
                    />
                  )}
                </Field>
              </TextFieldGroupContainer>

              <Field name={'email'} type={'email'}>
                {(props: FieldProps) => {
                  const placeholder = isEmailRequired
                    ? '*Email address (required)'
                    : 'Email address'
                  return (
                    <TextFieldWithError
                      required={isEmailRequired}
                      id={'email'}
                      placeholder={placeholder}
                      {...props.field}
                    />
                  )
                }}
              </Field>
              <CheckboxContainer>
                <CheckboxLabel disabled={!isAuthor}>
                  <Field name={'isCorresponding'}>
                    {(props: FieldProps) => (
                      <CheckboxField
                        id={'isCorresponding'}
                        checked={props.field.value}
                        disabled={!isAuthor}
                        {...props.field}
                      />
                    )}
                  </Field>
                  <LabelText>Corresponding Author</LabelText>
                </CheckboxLabel>

                <CheckboxLabel>
                  <Field name={'role'} type={'checkbox'}>
                    {(props: FieldProps) => (
                      <CheckboxField
                        name={'role'}
                        checked={isAuthor}
                        onChange={(e) => {
                          formik.setFieldValue(
                            props.field.name,
                            e.target.checked ? 'author' : 'other',
                            false
                          )
                        }}
                      />
                    )}
                  </Field>
                  <LabelText>Include in Authors List</LabelText>
                </CheckboxLabel>
              </CheckboxContainer>

              <OrcidContainer>
                <TextFieldLabel>
                  <LabelText>ORCID</LabelText>
                  <Field name={'ORCIDIdentifier'} type={'text'}>
                    {(props: FieldProps) => (
                      <TextField
                        id={'orcid'}
                        placeholder={'https://orcid.org/...'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </TextFieldLabel>
              </OrcidContainer>
              <Field name="affiliations" type="hidden">
                {(props: FieldProps) => {
                  console.log(selectedAffiliations)
                  return (
                    <TextField
                      type="hidden"
                      {...props.field}
                      value={selectedAffiliations || []}
                    />
                  )
                }}
              </Field>
            </Fieldset>
          </ChangeHandlingForm>
        )
      }}
    </Formik>
  )
}
