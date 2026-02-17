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
import { ChangeHandlingForm } from '../ChangeHandlingForm'

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
    if (isEmailRequired && !values.email) {
      errors.email = 'Email address is required'
    } else if (
      values.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
    ) {
      errors.email = 'Invalid email address'
    }
    return errors
  }

  return (
    <Formik<ContributorAttrs>
      initialValues={values}
      onSubmit={onSave}
      enableReinitialize={true}
      validateOnChange={true}
      innerRef={formRef}
      validate={validateAuthor}
    >
      {(formik) => {
        return (
          <ChangeHandlingForm
            onChange={onChange}
            id="author-details-form"
            formRef={authorFormRef}
            noValidate
          >
            <Fieldset>
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
                <Field name={'email'} type={'email'}>
                  {(props: FieldProps) => {
                    const hasError =
                      getIn(formik.touched, 'email') &&
                      getIn(formik.errors, 'email')
                    return (
                      <>
                        <Label htmlFor="email">
                          {isEmailRequired
                            ? 'Email address (required)'
                            : 'Email address'}
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
                <Field name={'role'}>
                  {(props: FieldProps) => (
                    <>
                      <Label htmlFor="role">Job Title</Label>
                      <TextField id={'role'} {...props.field} />
                    </>
                  )}
                </Field>
              </FormRow>
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
                <FormRow>
                  <Label htmlFor="orcid">ORCID</Label>
                  <Field name={'ORCID'} type={'text'}>
                    {(props: FieldProps) => (
                      <>
                        <Label htmlFor="orcid" className="sr-only">
                          ORCID
                        </Label>
                        <TextField
                          id={'orcid'}
                          placeholder={'https://orcid.org/...'}
                          pattern="https://orcid\.org/\d{4}-\d{4}-\d{4}-\d{3}[0-9Xx]"
                          title="Please enter a valid ORCID URL format: https://orcid.org/xxxx-xxxx-xxxx-xxxx"
                          {...props.field}
                        />
                      </>
                    )}
                  </Field>
                </FormRow>
              </OrcidContainer>
            </Fieldset>
          </ChangeHandlingForm>
        )
      }}
    </Formik>
  )
}
