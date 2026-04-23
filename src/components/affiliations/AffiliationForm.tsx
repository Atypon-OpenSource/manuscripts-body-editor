/*!
 * © 2024 Atypon Systems LLC
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
  FormGroup,
  FormRow,
  InputErrorText,
  Label,
  RequiredIndicator,
  SelectField,
  TextField,
} from '@manuscripts/style-guide'
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

import { COUNTRY_SELECT_OPTIONS } from '../../data/countryOptions'
import { AffiliationAttrs } from '../../lib/authors'
import { normalizeAffiliation } from '../../lib/normalize'
import { ChangeHandlingForm } from '../ChangeHandlingForm'
import { isInstitutionError } from '../hooks/useAffiliationShowsErrorIndicator'

function isAffiliationFieldChanged(
  formik: FormikProps<AffiliationAttrs>,
  key: keyof AffiliationAttrs | string
) {
  const v = normalizeAffiliation(formik.values)
  const i = normalizeAffiliation(formik.initialValues)
  return getIn(v, key) !== getIn(i, key)
}

export { affiliationShowsErrorIndicator } from '../hooks/useAffiliationShowsErrorIndicator'

export interface FormActions {
  reset: () => void
  submitForm: () => Promise<void> | void
}

export interface AffiliationFormProps {
  values: AffiliationAttrs
  onSave: (values: AffiliationAttrs) => void
  onChange: (values: AffiliationAttrs) => void
  actionsRef?: MutableRefObject<FormActions | undefined>
  newEntity?: boolean
  onAffiliationErrorChange?: (hasError: boolean) => void
  unsavedContinueActive?: boolean
}

export const AffiliationForm: React.FC<AffiliationFormProps> = ({
  values,
  onSave,
  onChange,
  actionsRef,
  newEntity = false,
  onAffiliationErrorChange,
  unsavedContinueActive = false,
}) => {
  const validateAffiliation = (vals: AffiliationAttrs) => {
    const errors: FormikErrors<AffiliationAttrs> = {}
    if (!vals.institution?.trim()) {
      errors.institution = 'Institution Name is required'
    }
    return errors
  }

  const formik = useFormik<AffiliationAttrs>({
    initialValues: values,
    onSubmit: (attrs) => onSave(attrs),
    enableReinitialize: true,
    validate: validateAffiliation,
    validateOnChange: true,
  })

  if (actionsRef) {
    actionsRef.current = {
      reset: () => formik.resetForm(),
      submitForm: () => formik.submitForm(),
    }
  }

  const showInstitutionError = isInstitutionError(formik, newEntity)

  useEffect(() => {
    onAffiliationErrorChange?.(showInstitutionError)
  }, [showInstitutionError, onAffiliationErrorChange])

  const showUnsavedDot = (key: keyof AffiliationAttrs | string) =>
    unsavedContinueActive && isAffiliationFieldChanged(formik, key)

  return (
    <FormikProvider value={formik}>
      <ChangeHandlingForm onChange={onChange} id="affiliation-form" noValidate>
        <FormRow>
          <Field name="institution">
            {(props: FieldProps) => (
              <>
                <UnsavedLabelRow>
                  {showUnsavedDot('institution') ? (
                    <FieldUnsavedDot aria-hidden />
                  ) : null}
                  <Label htmlFor="institution">
                    Institution Name
                    <RequiredIndicator>*</RequiredIndicator>
                  </Label>
                </UnsavedLabelRow>
                <TextField
                  id="institution"
                  {...props.field}
                  error={showInstitutionError}
                />
                {showInstitutionError && (
                  <InputErrorText>
                    {formik.errors.institution as string}
                  </InputErrorText>
                )}
              </>
            )}
          </Field>
        </FormRow>
        <FormRow>
          <Field name="department" type="textarea">
            {(props: FieldProps) => (
              <>
                <UnsavedLabelRow>
                  {showUnsavedDot('department') ? (
                    <FieldUnsavedDot aria-hidden />
                  ) : null}
                  <Label htmlFor="department">Department</Label>
                </UnsavedLabelRow>
                <TextField id="department" {...props.field} as="textarea" />
              </>
            )}
          </Field>
        </FormRow>
        <FormRow>
          <Field name="addressLine1">
            {(props: FieldProps) => (
              <>
                <UnsavedLabelRow>
                  {showUnsavedDot('addressLine1') ? (
                    <FieldUnsavedDot aria-hidden />
                  ) : null}
                  <Label htmlFor="addressLine1">Street Address</Label>
                </UnsavedLabelRow>
                <TextField id="addressLine1" {...props.field} />
              </>
            )}
          </Field>
        </FormRow>
        <StyledFormGroup>
          <FormRow>
            <UnsavedLabelRow>
              {showUnsavedDot('country') ? (
                <FieldUnsavedDot aria-hidden />
              ) : null}
              <Label htmlFor="country">Country</Label>
            </UnsavedLabelRow>
            <Field
              id="country"
              name="country"
              component={SelectField}
              options={COUNTRY_SELECT_OPTIONS}
              isSearchable={true}
              variant="large"
              listMaxHeight="140px"
            />
          </FormRow>
          <FormRow>
            <Field name="city">
              {(props: FieldProps) => (
                <>
                  <UnsavedLabelRow>
                    {showUnsavedDot('city') ? (
                      <FieldUnsavedDot aria-hidden />
                    ) : null}
                    <Label htmlFor="city">City</Label>
                  </UnsavedLabelRow>
                  <TextField id="city" {...props.field} />
                </>
              )}
            </Field>
          </FormRow>
        </StyledFormGroup>
        <StyledFormGroup>
          <FormRow>
            <Field name="county">
              {(props: FieldProps) => (
                <>
                  <UnsavedLabelRow>
                    {showUnsavedDot('county') ? (
                      <FieldUnsavedDot aria-hidden />
                    ) : null}
                    <Label htmlFor="county">State / Province</Label>
                  </UnsavedLabelRow>
                  <TextField id="county" {...props.field} />
                </>
              )}
            </Field>
          </FormRow>
          <FormRow>
            <Field name="postCode">
              {(props: FieldProps) => (
                <>
                  <UnsavedLabelRow>
                    {showUnsavedDot('postCode') ? (
                      <FieldUnsavedDot aria-hidden />
                    ) : null}
                    <Label htmlFor="postCode">Postal Code</Label>
                  </UnsavedLabelRow>
                  <TextField id="postCode" {...props.field} />
                </>
              )}
            </Field>
          </FormRow>
        </StyledFormGroup>
      </ChangeHandlingForm>
    </FormikProvider>
  )
}

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

const StyledFormGroup = styled(FormGroup)`
  > div {
    flex: 1;
    min-width: 0;
  }
`
