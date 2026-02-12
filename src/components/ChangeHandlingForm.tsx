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
import { Form, useFormikContext } from 'formik'
import React, { MutableRefObject, PropsWithChildren, useEffect } from 'react'
import styled from 'styled-components'

export interface ChangeHandlingFormProps<Values>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onChange'> {
  onChange: (values: Values) => void
  id?: string
  formRef?: MutableRefObject<HTMLFormElement | null>
}

export const ChangeHandlingForm = <Values,>(
  props: PropsWithChildren<ChangeHandlingFormProps<Values>>
) => {
  const { values } = useFormikContext<Values>()
  const { onChange, id, formRef, children, ...formProps } = props

  useEffect(() => {
    // you might modify this to fit your use case
    // like adding a `const prevValues = usePrevious(values)` above and checking for equality
    // or debounce this whole function but make sure not to use stale values
    onChange?.(values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, values])

  return (
    <FlexForm id={id} ref={formRef} {...formProps}>
      {children}
    </FlexForm>
  )
}

export const FlexForm = styled(Form)`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`
