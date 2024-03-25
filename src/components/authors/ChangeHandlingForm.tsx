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
import React, { PropsWithChildren, useEffect } from 'react'

export interface ChangeHandlingFormProps<Values> {
  onChange: (values: Values) => void
}

export const ChangeHandlingForm = <Values,>(
  props: PropsWithChildren<ChangeHandlingFormProps<Values>>
) => {
  const { values } = useFormikContext<Values>()

  useEffect(() => {
    // you might modify this to fit your use case
    // like adding a `const prevValues = usePrevious(values)` above and checking for equality
    // or debounce this whole function but make sure not to use stale values
    props.onChange?.(values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onChange, values])

  return <Form>{props.children}</Form>
}
