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

import { ContributorAttrs } from '../../lib/authors'

export function isNamePairError(
  formik: FormikProps<ContributorAttrs>,
  newEntity: boolean,
  requiredContinueActive = false
) {
  if (!getIn(formik.errors, 'given')) {
    return false
  }
  if (requiredContinueActive) {
    return true
  }
  if (newEntity) {
    return Boolean(formik.touched.given || formik.touched.family)
  }
  return Boolean(formik.touched.given || formik.touched.family || formik.dirty)
}

export function authorShowsErrorIndicator(
  formik: FormikProps<ContributorAttrs>,
  newEntity: boolean,
  requiredContinueActive = false
) {
  if (isNamePairError(formik, newEntity, requiredContinueActive)) {
    return true
  }
  if (
    (getIn(formik.touched, 'email') || requiredContinueActive) &&
    getIn(formik.errors, 'email')
  ) {
    return true
  }
  if (getIn(formik.touched, 'ORCID') && getIn(formik.errors, 'ORCID')) {
    return true
  }
  return false
}

export const useAuthorShowsErrorIndicator = (
  newEntity: boolean,
  requiredContinueActive: boolean,
  onChange?: (hasError: boolean) => void
) => {
  const formik = useFormikContext<ContributorAttrs>()
  const hasError = authorShowsErrorIndicator(
    formik,
    newEntity,
    requiredContinueActive
  )

  useEffect(() => {
    onChange?.(hasError)
  }, [hasError, onChange])
}
