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
import { TextArea, TextField } from '@manuscripts/style-guide'
import { Field, FieldProps, Formik, FormikProps } from 'formik'
import React, { useRef } from 'react'
import styled from 'styled-components'

import { AffiliationAttrs } from '../../lib/authors'
import { ChangeHandlingForm } from '../ChangeHandlingForm'

const Row = styled.div`
  display: flex;
`

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

const FormLabel = styled.legend`
  &:not(:first-child) {
    margin-top: 24px;
  }
  margin-bottom: 12px;
  font: ${(props) => props.theme.font.weight.normal}
    ${(props) => props.theme.font.size.xlarge} /
    ${(props) => props.theme.font.lineHeight.large}
    ${(props) => props.theme.font.family.sans};
  letter-spacing: -0.4px;
  color: ${(props) => props.theme.colors.text.secondary};
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
  return (
    <Formik<AffiliationAttrs>
      initialValues={values}
      onSubmit={onSave}
      innerRef={formRef}
      enableReinitialize={true}
    >
      {() => (
        <ChangeHandlingForm onChange={onChange}>
          <FormLabel>Institution*</FormLabel>
          <Row>
            <Field name="institution">
              {(props: FieldProps) => (
                <AffiliationsTextField
                  id="institution"
                  placeholder="Institution Name"
                  {...props.field}
                />
              )}
            </Field>
          </Row>
          <FormLabel>Details</FormLabel>
          <Row>
            <Field name="department">
              {(props: FieldProps) => (
                <DepartmentTextField
                  id="department"
                  placeholder="Department"
                  {...props.field}
                />
              )}
            </Field>
          </Row>
          <Row>
            <Field name="addressLine1">
              {(props: FieldProps) => (
                <AffiliationsTextField
                  id="addressLine1"
                  placeholder="Street Address"
                  {...props.field}
                />
              )}
            </Field>
          </Row>
          <Row>
            <Field name="city">
              {(props: FieldProps) => (
                <AffiliationsTextField
                  id="city"
                  placeholder="City"
                  {...props.field}
                  style={{ marginRight: '4px' }}
                />
              )}
            </Field>
            <Field name="county">
              {(props: FieldProps) => (
                <AffiliationsTextField
                  id="county"
                  placeholder="State / Province"
                  {...props.field}
                />
              )}
            </Field>
          </Row>
          <Row>
            <Field name="postCode">
              {(props: FieldProps) => (
                <AffiliationsTextField
                  id="postCode"
                  placeholder="Postal Code"
                  {...props.field}
                  style={{ marginRight: '4px' }}
                />
              )}
            </Field>
            <Field name="country">
              {({ field }: FieldProps) => (
                <AffiliationsTextField
                  id="country"
                  placeholder="Country"
                  {...field}
                />
              )}
            </Field>
          </Row>
        </ChangeHandlingForm>
      )}
    </Formik>
  )
}
