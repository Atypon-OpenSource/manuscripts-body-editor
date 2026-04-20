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
  FormGroup,
  LabelText,
  RequiredIndicator,
  FormSubtitle,
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
  useFormikContext,
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

const NAME_PAIR_REQUIRED_MESSAGE = 'Please enter Given Name or Family Name'

function isAuthorFieldChanged(
  formik: FormikProps<ContributorAttrs>,
  key: string
): boolean {
  if (key === 'degrees') {
    const t = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
    return (
      t(getIn(formik.values, 'degrees')) !==
      t(getIn(formik.initialValues, 'degrees'))
    )
  }
  const v = normalizeAuthor(formik.values)
  const i = normalizeAuthor(formik.initialValues)
  const va = getIn(v, key as keyof ContributorAttrs)
  const vb = getIn(i, key as keyof ContributorAttrs)
  if (key === 'affiliationIDs' || key === 'creditRoles') {
    return JSON.stringify(va ?? []) !== JSON.stringify(vb ?? [])
  }
  return va !== vb
}

function getShowNamePairError(
  formik: FormikProps<ContributorAttrs>,
  newEntity: boolean
): boolean {
  if (!getIn(formik.errors, 'given')) {
    return false
  }
  if (newEntity) {
    return Boolean(formik.touched.given || formik.touched.family)
  }
  return Boolean(formik.touched.given || formik.touched.family || formik.dirty)
}

export function authorDetailsTabShowsErrorIndicator(
  formik: FormikProps<ContributorAttrs>,
  newEntity: boolean
): boolean {
  if (getShowNamePairError(formik, newEntity)) {
    return true
  }
  if (getIn(formik.touched, 'email') && getIn(formik.errors, 'email')) {
    return true
  }
  if (getIn(formik.touched, 'ORCID') && getIn(formik.errors, 'ORCID')) {
    return true
  }
  return false
}

const AuthorDetailsTabErrorBridge: React.FC<{
  newEntity: boolean
  onChange?: (hasError: boolean) => void
}> = ({ newEntity, onChange }) => {
  const formik = useFormikContext<ContributorAttrs>()
  const hasError = authorDetailsTabShowsErrorIndicator(formik, newEntity)
  useEffect(() => {
    onChange?.(hasError)
  }, [hasError, onChange])
  return null
}

export interface FormActions {
  reset: () => void
  submitForm: () => Promise<void> | void
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
  newEntity: boolean
  onAuthorDetailsTabErrorChange?: (hasError: boolean) => void
  unsavedContinueActive?: boolean
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
  newEntity,
  onAuthorDetailsTabErrorChange,
  unsavedContinueActive = false,
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

  if (actionsRef) {
    actionsRef.current = {
      reset: () => formRef.current?.resetForm(),
      submitForm: () => formRef.current?.submitForm(),
    }
  }

  const validateAuthor = (values: ContributorAttrs) => {
    const errors: FormikErrors<ContributorAttrs> = {}
    const given = values.given?.trim() ?? ''
    const family = values.family?.trim() ?? ''
    if (!given && !family) {
      errors.given = NAME_PAIR_REQUIRED_MESSAGE
      errors.family = NAME_PAIR_REQUIRED_MESSAGE
    }

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
        const showNamePairError = getShowNamePairError(formik, newEntity)
        const showUnsavedDot = (key: string) =>
          unsavedContinueActive && isAuthorFieldChanged(formik, key)

        return (
          <ChangeHandlingForm<ContributorAttrs>
            onChange={(next) => onChange(normalizeAuthor(next))}
            id="author-details-form"
            formRef={authorFormRef}
            noValidate
          >
            <AuthorDetailsTabErrorBridge
              newEntity={newEntity}
              onChange={onAuthorDetailsTabErrorChange}
            />
            <FormSubtitle>Name</FormSubtitle>
            <StyledFormGroup>
              <FormRow>
                <Field name={'prefix'}>
                  {(props: FieldProps) => (
                    <>
                      <UnsavedLabelRow>
                        {showUnsavedDot('prefix') ? (
                          <FieldUnsavedDot aria-hidden />
                        ) : null}
                        <Label htmlFor="prefix">Prefix</Label>
                      </UnsavedLabelRow>
                      <TextField
                        id={'prefix'}
                        {...props.field}
                        placeholder="E.g. Doctor"
                      />
                    </>
                  )}
                </Field>
              </FormRow>
              <StyledFormRow>
                <Field name={'given'}>
                  {(props: FieldProps) => (
                    <>
                      <UnsavedLabelRow>
                        {showUnsavedDot('given') ? (
                          <FieldUnsavedDot aria-hidden />
                        ) : null}
                        <Label htmlFor="given-name">
                          Given name<RequiredIndicator>*</RequiredIndicator>
                        </Label>
                      </UnsavedLabelRow>
                      <TextFieldWithError
                        id={'given-name'}
                        {...props.field}
                        error={showNamePairError}
                      />
                      {showNamePairError && (
                        <InputErrorText>
                          {NAME_PAIR_REQUIRED_MESSAGE}
                        </InputErrorText>
                      )}
                    </>
                  )}
                </Field>
              </StyledFormRow>
            </StyledFormGroup>
            <StyledFormGroup>
              <StyledFormRow>
                <Field name={'family'}>
                  {(props: FieldProps) => (
                    <>
                      <UnsavedLabelRow>
                        {showUnsavedDot('family') ? (
                          <FieldUnsavedDot aria-hidden />
                        ) : null}
                        <Label htmlFor="family-name">
                          Family name<RequiredIndicator>*</RequiredIndicator>
                        </Label>
                      </UnsavedLabelRow>
                      <TextFieldWithError
                        id={'family-name'}
                        {...props.field}
                        error={showNamePairError}
                      />
                      {showNamePairError && (
                        <InputErrorText>
                          {NAME_PAIR_REQUIRED_MESSAGE}
                        </InputErrorText>
                      )}
                    </>
                  )}
                </Field>
              </StyledFormRow>
              <FormRow>
                <Field name={'suffix'}>
                  {(props: FieldProps) => (
                    <>
                      <UnsavedLabelRow>
                        {showUnsavedDot('suffix') ? (
                          <FieldUnsavedDot aria-hidden />
                        ) : null}
                        <Label htmlFor="suffix">Suffix</Label>
                      </UnsavedLabelRow>
                      <TextField
                        id={'suffix'}
                        {...props.field}
                        placeholder="E.g. Junior"
                      />
                    </>
                  )}
                </Field>
              </FormRow>
            </StyledFormGroup>
            <FormSubtitle>Addition Information</FormSubtitle>
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
                  <UnsavedLabelRow>
                    {showUnsavedDot('isCorresponding') ? (
                      <FieldUnsavedDot aria-hidden />
                    ) : null}
                    <LabelText>Corresponding Author</LabelText>
                  </UnsavedLabelRow>
                </CheckboxLabel>
              </CheckboxContainer>
            </FormRow>
            <FormRow>
              <Field name={'email'} type={'email'}>
                {(props: FieldProps) => {
                  const hasError =
                    getIn(formik.touched, 'email') &&
                    getIn(formik.errors, 'email')
                  return (
                    <>
                      <UnsavedLabelRow>
                        {showUnsavedDot('email') ? (
                          <FieldUnsavedDot aria-hidden />
                        ) : null}
                        <Label htmlFor="email">
                          {isEmailRequired ? (
                            <>
                              <LabelText>
                                Email address
                                <RequiredIndicator>*</RequiredIndicator>
                              </LabelText>
                            </>
                          ) : (
                            'Email address'
                          )}
                        </Label>
                      </UnsavedLabelRow>
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
                    <UnsavedLabelRow>
                      {showUnsavedDot('role') ? (
                        <FieldUnsavedDot aria-hidden />
                      ) : null}
                      <Label htmlFor="role">Job Title</Label>
                    </UnsavedLabelRow>
                    <TextField id={'role'} {...props.field} />
                  </>
                )}
              </Field>
            </FormRow>
            <FormRow>
              <Field name={'ORCID'} type={'text'}>
                {(props: FieldProps) => {
                  const hasError =
                    getIn(formik.touched, 'ORCID') &&
                    getIn(formik.errors, 'ORCID')
                  return (
                    <>
                      <UnsavedLabelRow>
                        {showUnsavedDot('ORCID') ? (
                          <FieldUnsavedDot aria-hidden />
                        ) : null}
                        <Label htmlFor="orcid">ORCID</Label>
                      </UnsavedLabelRow>
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
              <Field name={'degrees'}>
                {(props: FieldProps) => (
                  <>
                    <UnsavedLabelRow>
                      {showUnsavedDot('degrees') ? (
                        <FieldUnsavedDot aria-hidden />
                      ) : null}
                      <Label htmlFor="degrees">Qualification</Label>
                    </UnsavedLabelRow>
                    <TextField
                      id={'degrees'}
                      {...props.field}
                      placeholder="E.g. Bsc Computer Science"
                    />
                  </>
                )}
              </Field>
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

const UnsavedLabelRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`

const FieldUnsavedDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => props.theme.colors.text.warning};
  flex-shrink: 0;
`

export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
`
export const StyledFormGroup = styled(FormGroup)`
  [name='prefix'] {
    width: 180px;
  }
  [name='suffix'] {
    width: 180px;
  }
`

export const StyledFormRow = styled(FormRow)`
  flex: 1;
`
