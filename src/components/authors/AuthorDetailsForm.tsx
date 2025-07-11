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
  CheckboxField,
  CheckboxLabel,
  TextField,
  TextFieldGroupContainer,
  TextFieldLabel,
} from '@manuscripts/style-guide'
import { CreditRole } from '@manuscripts/transform'
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

export const CheckboxContainer = styled.div`
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
  authorFormRef?: MutableRefObject<HTMLFormElement | null>
  actionsRef?: MutableRefObject<FormActions | undefined>
  isEmailRequired?: boolean
  selectedAffiliations?: string[]
  selectedCreditRoles: CreditRole[]
}

export const AuthorDetailsForm: React.FC<AuthorDetailsFormProps> = ({
  values,
  onChange,
  onSave,
  actionsRef,
  isEmailRequired,
  selectedAffiliations,
  selectedCreditRoles,
  authorFormRef,
}) => {
  const formRef = useRef<FormikProps<ContributorAttrs>>(null)

  useEffect(() => {
    if (selectedAffiliations && formRef.current) {
      formRef.current.setFieldValue('affiliations', selectedAffiliations)
    }
  }, [selectedAffiliations])

  useEffect(() => {
    if (selectedCreditRoles && formRef.current) {
      formRef.current.setFieldValue('creditRoles', selectedCreditRoles)
    }
  }, [selectedCreditRoles])

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
      {() => {
        return (
          <ChangeHandlingForm
            onChange={onChange}
            id="author-details-form"
            formRef={authorFormRef}
          >
            <Fieldset>
              <TextFieldGroupContainer>
                <Field name={'prefix'}>
                  {(props: FieldProps) => (
                    <TextField
                      id={'prefix'}
                      placeholder={'Prefix'}
                      {...props.field}
                    />
                  )}
                </Field>
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
                      id={'email'}
                      type="email"
                      required={isEmailRequired}
                      placeholder={placeholder}
                      {...props.field}
                    />
                  )
                }}
              </Field>
              <Field name={'role'}>
                {(props: FieldProps) => (
                  <TextField
                    id={'role'}
                    placeholder={'Job Title'}
                    {...props.field}
                  />
                )}
              </Field>
              <CheckboxContainer>
                <CheckboxLabel>
                  <Field name={'isCorresponding'}>
                    {(props: FieldProps) => (
                      <CheckboxField
                        id={'isCorresponding'}
                        checked={props.field.value}
                        {...props.field}
                      />
                    )}
                  </Field>
                  <LabelText>Corresponding Author</LabelText>
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
                        pattern="https://orcid\.org/\d{4}-\d{4}-\d{4}-\d{4}"
                        title="Please enter a valid ORCID URL format: https://orcid.org/xxxx-xxxx-xxxx-xxxx"
                        {...props.field}
                      />
                    )}
                  </Field>
                </TextFieldLabel>
              </OrcidContainer>
            </Fieldset>
          </ChangeHandlingForm>
        )
      }}
    </Formik>
  )
}
