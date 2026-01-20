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
  FormLabel,
  FormRow,
  InputErrorText,
  Label,
  TextArea,
  TextField,
} from '@manuscripts/style-guide'
import { Field, FieldProps, Formik, FormikProps, FormikErrors } from 'formik'
import React, { useRef } from 'react'
import styled from 'styled-components'

import { AffiliationAttrs } from '../../lib/authors'
import { ChangeHandlingForm } from '../ChangeHandlingForm'


const AffiliationsTextField = styled(TextField)`
  border-radius: 0;
  background: transparent;
  margin-bottom: 4px;
  border-radius: ${(props) => props.theme.grid.radius.default};
  &[aria-invalid] {
    background: ${(props) => props.theme.colors.background.warning};
  }

  &[aria-invalid]:focus {
    background: transparent;
  }
`

const DepartmentTextField = styled(TextArea)`
  border-radius: 0;
  background: transparent;
  margin-bottom: 4px;
  min-height: 60px;
  border-radius: ${(props) => props.theme.grid.radius.default};
  &[aria-invalid] {
    background: ${(props) => props.theme.colors.background.warning};
  }

  &[aria-invalid]:focus {
    background: transparent;
  }
`



const MarginRightTextField = styled(AffiliationsTextField)`
  margin-right: 4px;
`

export interface FormActions {
  reset: () => void
}
export interface AffiliationFormProps {
  values: AffiliationAttrs
  onSave: (values: AffiliationAttrs) => void
  onChange: (values: AffiliationAttrs) => void
  actionsRef?: React.MutableRefObject<FormActions | undefined>
}

export const AffiliationForm: React.FC<AffiliationFormProps> = ({
  values,
  onSave,
  onChange,
  actionsRef,
}) => {
  if (actionsRef && !actionsRef.current) {
    actionsRef.current = {
      reset: () => {
        formRef.current?.resetForm()
      },
    }
  }
  const formRef = useRef<FormikProps<AffiliationAttrs>>(null)
  const validateAffiliation = (values: AffiliationAttrs) => {
    const errors: FormikErrors<AffiliationAttrs> = {}
    if (!values.institution?.trim()) {
      errors.institution = 'Institution Name is required'
    }
    return errors
  }

  return (
    <Formik<AffiliationAttrs>
      initialValues={values}
      onSubmit={onSave}
      innerRef={formRef}
      enableReinitialize={true}
      validate={validateAffiliation}
    >
      {(formik) => (
        <ChangeHandlingForm
          onChange={onChange}
          id="affiliation-form"
          noValidate
        >
          <FormLabel>Institution*</FormLabel>
          <FormRow>
            <Field name="institution">
              {(props: FieldProps) => {
                const hasError =
                  formik.touched.institution && formik.errors.institution
                return (
                  <>
                    <Label htmlFor="institution">Institution Name</Label>
                    <AffiliationsTextField
                      id="institution"
                      {...props.field}
                      error={hasError}
                    />
                    {hasError && (
                      <InputErrorText>
                        {formik.errors.institution as string}
                      </InputErrorText>
                    )}
                  </>
                )
              }}
            </Field>
          </FormRow>
          <FormLabel>Details</FormLabel>
          <FormRow>
            <Field name="department">
              {(props: FieldProps) => (
                <>
                  <Label htmlFor="department">Department</Label>
                  <DepartmentTextField id="department" {...props.field} />
                </>
              )}
            </Field>
          </FormRow>
          <FormRow>
            <Field name="addressLine1">
              {(props: FieldProps) => (
                <>
                  <Label htmlFor="addressLine1">Street Address</Label>
                  <AffiliationsTextField id="addressLine1" {...props.field} />
                </>
              )}
            </Field>
          </FormRow>
          <FormRow>
            <Field name="city">
              {(props: FieldProps) => (
                <>
                  <Label htmlFor="city">City</Label>
                  <MarginRightTextField id="city" {...props.field} />
                </>
              )}
            </Field>
            <Field name="county">
              {(props: FieldProps) => (
                <>
                  <Label htmlFor="county">State / Province</Label>
                  <AffiliationsTextField id="county" {...props.field} />
                </>
              )}
            </Field>
          </FormRow>
          <FormRow>
            <Field name="postCode">
              {(props: FieldProps) => (
                <>
                  <Label htmlFor="postCode">Postal Code</Label>
                  <MarginRightTextField id="postCode" {...props.field} />
                </>
              )}
            </Field>
            <Field name="country">
              {({ field }: FieldProps) => (
                <>
                  <Label htmlFor="country">Country</Label>
                  <AffiliationsTextField id="country" {...field} />
                </>
              )}
            </Field>
          </FormRow>
        </ChangeHandlingForm>
      )}
    </Formik>
  )
}
