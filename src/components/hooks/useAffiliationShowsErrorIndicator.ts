/*!
 * © 2026 Atypon Systems LLC
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
import { FormikProps, getIn, useFormikContext } from 'formik'
import { useEffect } from 'react'

import { AffiliationAttrs } from '../../lib/authors'

export function isInstitutionError(
  formik: FormikProps<AffiliationAttrs>,
  newEntity: boolean
) {
  if (!getIn(formik.errors, 'institution')) {
    return false
  }
  if (newEntity) {
    return Boolean(formik.touched.institution || formik.dirty)
  }
  return Boolean(formik.touched.institution)
}

export function affiliationShowsErrorIndicator(
  formik: FormikProps<AffiliationAttrs>,
  newEntity: boolean
) {
  return isInstitutionError(formik, newEntity)
}

export const useAffiliationShowsErrorIndicator = (
  newEntity: boolean,
  onChange?: (hasError: boolean) => void
) => {
  const formik = useFormikContext<AffiliationAttrs>()
  const hasError = affiliationShowsErrorIndicator(formik, newEntity)

  useEffect(() => {
    onChange?.(hasError)
  }, [hasError, onChange])
}
