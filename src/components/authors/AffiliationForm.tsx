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
import { TextField } from '@manuscripts/style-guide'
import { Field, FieldProps, Formik } from 'formik'
import React from 'react'
import styled from 'styled-components'

import { AffiliationAttrs } from '../../lib/authors'
import { ChangeHandlingForm } from '../ChangeHandlingForm'

const Row = styled.div`
  display: flex;
  border-top: 1px solid ${(props) => props.theme.colors.border.field.default};
  &:first-child {
    border-top: none;
  }
`

const AffiliationsTextField = styled(TextField)`
  border: none;
  border-radius: 0;
  background: transparent;
  &:not(:first-child) {
    border-left: 1px solid ${(props) => props.theme.colors.border.field.default};
  }

  &[aria-invalid] {
    background: ${(props) => props.theme.colors.background.warning};
  }

  &[aria-invalid]:focus {
    background: transparent;
  }
`

export interface AffiliationFormProps {
  values: AffiliationAttrs
  onSave: (values: AffiliationAttrs) => void
}

export const AffiliationForm: React.FC<AffiliationFormProps> = ({
  values,
  onSave,
}) => {
  return (
    <Formik<AffiliationAttrs> initialValues={values} onSubmit={onSave}>
      {() => (
        <ChangeHandlingForm onChange={onSave}>
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
          <Row>
            <Field name="department">
              {(props: FieldProps) => (
                <AffiliationsTextField
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
                />
              )}
            </Field>
            <Field name="country">
              {(props: FieldProps) => (
                <AffiliationsTextField
                  id="country"
                  placeholder="Country"
                  {...props.field}
                />
              )}
            </Field>
          </Row>
        </ChangeHandlingForm>
      )}
    </Formik>
  )
}
