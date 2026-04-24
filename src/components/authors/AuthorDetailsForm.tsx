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
  FormRow,
  FormGroup,
  LabelText,
  RequiredIndicator,
  MultiValueInput,
} from '@manuscripts/style-guide'
import { CreditRole } from '@manuscripts/transform'
import {
  Field,
  FieldProps,
  FormikErrors,
  FormikProps,
  FormikProvider,
  getIn,
  useFormik,
} from 'formik'
import React, { MutableRefObject, useEffect } from 'react'
import styled from 'styled-components'

import { ContributorAttrs } from '../../lib/authors'
import { normalizeAuthor } from '../../lib/normalize'
import { ChangeHandlingForm } from '../ChangeHandlingForm'
import {
  UnsavedLabel,
  UnsavedLabelRow,
  FieldUnsavedDot,
} from '../form/UnsavedLabel'
import {
  isNamePairError,
  useAuthorShowsErrorIndicator,
} from '../hooks/useAuthorShowsErrorIndicator'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ORCID_URL_REGEX =
  /^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[0-9Xx]\/?$/
const ORCID_INPUT_PATTERN = ORCID_URL_REGEX.source.slice(1, -1)

const NAME_PAIR_REQUIRED_MESSAGE = 'Please enter Given Name or Family Name'

function isAuthorFieldChanged(
  formik: FormikProps<ContributorAttrs>,
  key: string
) {
  const v = normalizeAuthor(formik.values)
  const i = normalizeAuthor(formik.initialValues)
  const va = getIn(v, key as keyof ContributorAttrs)
  const vb = getIn(i, key as keyof ContributorAttrs)
  if (key === 'affiliationIDs' || key === 'creditRoles' || key === 'degrees') {
    return (
      va.length !== vb.length ||
      (va as string[]).some((item, i) => item !== vb[i])
    )
  }
  return va !== vb
}

export { authorShowsErrorIndicator as authorDetailsTabShowsErrorIndicator } from '../hooks/useAuthorShowsErrorIndicator'

const AuthorErrorEffect: React.FC<{
  newEntity: boolean
  requiredContinueActive: boolean
  onChange?: (hasError: boolean) => void
}> = ({ newEntity, requiredContinueActive, onChange }) => {
  useAuthorShowsErrorIndicator(newEntity, requiredContinueActive, onChange)
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
  requiredContinueActive?: boolean
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
  requiredContinueActive = false,
}) => {
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

  const formik = useFormik<ContributorAttrs>({
    initialValues: values,
    onSubmit: (submitted) => onSave(normalizeAuthor(submitted)),
    enableReinitialize: true,
    validateOnChange: true,
    validate: validateAuthor,
  })

  useEffect(() => {
    if (selectedAffiliations) {
      formik.setFieldValue('affiliationIDs', selectedAffiliations)
    }
  }, [selectedAffiliations])

  useEffect(() => {
    if (selectedCreditRoles) {
      formik.setFieldValue('creditRoles', selectedCreditRoles)
    }
  }, [selectedCreditRoles])

  if (actionsRef) {
    actionsRef.current = {
      reset: () => formik.resetForm(),
      submitForm: () => formik.submitForm(),
    }
  }

  const showNamePairError = isNamePairError(
    formik,
    newEntity,
    requiredContinueActive
  )
  const showUnsavedDot = (key: string) =>
    unsavedContinueActive && isAuthorFieldChanged(formik, key)

  return (
    <FormikProvider value={formik}>
      <AuthorErrorEffect
        newEntity={newEntity}
        requiredContinueActive={requiredContinueActive}
        onChange={onAuthorDetailsTabErrorChange}
      />
      <ChangeHandlingForm<ContributorAttrs>
        onChange={(next) => onChange(normalizeAuthor(next))}
        id="author-details-form"
        formRef={authorFormRef}
        noValidate
      >
        <StyledFormGroup>
          <FormRow>
            <Field name={'prefix'}>
              {(props: FieldProps) => (
                <>
                  <UnsavedLabel
                    htmlFor="prefix"
                    showDot={showUnsavedDot('prefix')}
                  >
                    Prefix
                  </UnsavedLabel>
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
                  <UnsavedLabel
                    htmlFor="given-name"
                    showDot={showUnsavedDot('given')}
                  >
                    Given name<RequiredIndicator>*</RequiredIndicator>
                  </UnsavedLabel>
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
                  <UnsavedLabel
                    htmlFor="family-name"
                    showDot={showUnsavedDot('family')}
                  >
                    Family name<RequiredIndicator>*</RequiredIndicator>
                  </UnsavedLabel>
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
                  <UnsavedLabel
                    htmlFor="suffix"
                    showDot={showUnsavedDot('suffix')}
                  >
                    Suffix
                  </UnsavedLabel>
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
                (getIn(formik.touched, 'email') || requiredContinueActive) &&
                getIn(formik.errors, 'email')
              return (
                <>
                  <UnsavedLabel
                    htmlFor="email"
                    showDot={showUnsavedDot('email')}
                  >
                    {isEmailRequired ? (
                      <LabelText>
                        Email address
                        <RequiredIndicator>*</RequiredIndicator>
                      </LabelText>
                    ) : (
                      'Email address'
                    )}
                  </UnsavedLabel>
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
                <UnsavedLabel htmlFor="role" showDot={showUnsavedDot('role')}>
                  Job Title
                </UnsavedLabel>
                <TextField id={'role'} {...props.field} />
              </>
            )}
          </Field>
        </FormRow>
        <FormRow>
          <Field name={'ORCID'} type={'text'}>
            {(props: FieldProps) => {
              const hasError =
                getIn(formik.touched, 'ORCID') && getIn(formik.errors, 'ORCID')
              return (
                <>
                  <UnsavedLabel
                    htmlFor="orcid"
                    showDot={showUnsavedDot('ORCID')}
                  >
                    ORCID
                  </UnsavedLabel>
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
          <UnsavedLabel htmlFor="degrees" showDot={showUnsavedDot('degrees')}>
            Qualification
          </UnsavedLabel>
          <MultiValueInput
            id={'degrees'}
            inputType="text"
            placeholder="E.g. Bsc Computer Science"
            initialValues={
              Array.isArray(formik.values.degrees) ? formik.values.degrees : []
            }
            onChange={(values) => {
              formik.setFieldValue('degrees', values)
            }}
          />
        </FormRow>
      </ChangeHandlingForm>
    </FormikProvider>
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
