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
  InputErrorText,
  Label,
  FormRow,
  LabelText,
  MultiValueInput,
} from '@manuscripts/style-guide'
import { CreditRole } from '@manuscripts/transform'
import {
  Field,
  FieldProps,
  Formik,
  FormikProps,
  getIn,
  FormikErrors,
} from 'formik'
import React, { MutableRefObject, useEffect, useRef } from 'react'
import styled from 'styled-components'

import { ContributorAttrs } from '../../lib/authors'
import { normalizeAuthor } from '../../lib/normalize'
import { ChangeHandlingForm } from '../ChangeHandlingForm'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ORCID_URL_REGEX =
  /^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[0-9Xx]\/?$/
const ORCID_INPUT_PATTERN = ORCID_URL_REGEX.source.slice(1, -1)
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
      formRef.current.setFieldValue('affiliationIDs', selectedAffiliations)
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

  const validateAuthor = (values: ContributorAttrs) => {
    const errors: FormikErrors<ContributorAttrs> = {}
    const email = values.email?.trim()
    if (isEmailRequired && !email) {
      errors.email = 'Email address is required'
    } else if (email && !EMAIL_REGEX.test(email)) {
      errors.email = 'Invalid email address'
    }

    const orcid = values.ORCID?.trim()
    if (orcid && !ORCID_URL_REGEX.test(orcid)) {
      errors.ORCID =
        'Please enter a valid ORCID URL: https://orcid.org/xxxx-xxxx-xxxx-xxxx'
    }
    return errors
  }

  return (
    <Formik<ContributorAttrs>
      initialValues={values}
      onSubmit={(submitted) => onSave(normalizeAuthor(submitted))}
      enableReinitialize={true}
      validateOnChange={true}
      innerRef={formRef}
      validate={validateAuthor}
    >
      {(formik) => {
        return (
          <ChangeHandlingForm<ContributorAttrs>
            onChange={(next) => onChange(normalizeAuthor(next))}
            id="author-details-form"
            formRef={authorFormRef}
            noValidate
          >
            <FormRow>
              <Field name={'prefix'}>
                {(props: FieldProps) => (
                  <>
                    <Label htmlFor="prefix">Prefix</Label>
                    <TextField id={'prefix'} {...props.field} />
                  </>
                )}
              </Field>
            </FormRow>
            <FormRow>
              <Field name={'given'}>
                {(props: FieldProps) => (
                  <>
                    <Label htmlFor="given-name">Given name</Label>
                    <TextField id={'given-name'} {...props.field} />
                  </>
                )}
              </Field>
            </FormRow>
            <FormRow>
              <Field name={'family'}>
                {(props: FieldProps) => (
                  <>
                    <Label htmlFor="family-name">Family name</Label>
                    <TextField id={'family-name'} {...props.field} />
                  </>
                )}
              </Field>
            </FormRow>
            <FormRow>
              <Field name={'suffix'}>
                {(props: FieldProps) => (
                  <>
                    <Label htmlFor="suffix">Suffix</Label>
                    <TextField id={'suffix'} {...props.field} />
                  </>
                )}
              </Field>
            </FormRow>
            <FormRow>
              <Field name={'role'}>
                {(props: FieldProps) => (
                  <>
                    <Label htmlFor="role">Job Title</Label>
                    <TextField id={'role'} {...props.field} />
                  </>
                )}
              </Field>
            </FormRow>
            <FormRow>
              <Field name={'email'} type={'email'}>
                {(props: FieldProps) => {
                  const hasError =
                    getIn(formik.touched, 'email') &&
                    getIn(formik.errors, 'email')
                  return (
                    <>
                      <Label htmlFor="email">
                        {isEmailRequired ? 'Email address*' : 'Email address'}
                      </Label>
                      <TextFieldWithError
                        id={'email'}
                        type="email"
                        required={isEmailRequired}
                        {...props.field}
                        error={hasError}
                      />
                      {hasError && (
                        <InputErrorText>
                          {getIn(formik.errors, 'email')}
                        </InputErrorText>
                      )}
                    </>
                  )
                }}
              </Field>
            </FormRow>
            <FormRow>
              <CheckboxContainer data-cy="corresponding-author-container">
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
            </FormRow>
            <FormRow>
              <Field name={'ORCID'} type={'text'}>
                {(props: FieldProps) => {
                  const hasError =
                    getIn(formik.touched, 'ORCID') &&
                    getIn(formik.errors, 'ORCID')
                  return (
                    <>
                      <Label htmlFor="orcid">ORCID</Label>
                      <TextFieldWithError
                        id={'orcid'}
                        type="url"
                        placeholder={'https://orcid.org/...'}
                        {...props.field}
                        pattern={ORCID_INPUT_PATTERN}
                        title="Please enter a valid ORCID URL: https://orcid.org/xxxx-xxxx-xxxx-xxxx"
                        error={hasError}
                      />
                      {hasError && (
                        <InputErrorText>
                          {getIn(formik.errors, 'ORCID')}
                        </InputErrorText>
                      )}
                    </>
                  )
                }}
              </Field>
            </FormRow>
            <FormRow>
              <Label htmlFor={'degrees'}>Degrees</Label>
              <MultiValueInput
                id="degrees"
                inputType="text"
                placeholder="Enter degree and press enter"
                initialValues={values.degrees}
                onChange={(newValues) => {
                  formik.setFieldValue('degrees', newValues)
                }}
              />
            </FormRow>
          </ChangeHandlingForm>
        )
      }}
    </Formik>
  )
}

export const Fieldset = styled.fieldset`
  padding: 0;
  margin: 0;
  border: none;
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
