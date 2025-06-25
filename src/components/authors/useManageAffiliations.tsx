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
import { useReducer, useState } from 'react'

import { arrayReducer } from '../../lib/array-reducer'
import { AffiliationAttrs, ContributorAttrs } from '../../lib/authors'

export const affiliationsReducer = arrayReducer<AffiliationAttrs>(
  (a, b) => a.id === b.id
)

export const useManageAffiliations = (
  selection: ContributorAttrs | undefined,
  $affiliations: AffiliationAttrs[]
) => {
  const [affiliations] = useReducer(affiliationsReducer, $affiliations)
  const [showAffiliationDrawer, setShowAffiliationDrawer] = useState(false)
  const [selectedAffiliations, setSelectedAffiliations] = useState<
    {
      id: string
      institution: string
    }[]
  >([])

  const removeAffiliation = (affId: string) => {
    if (!selection) {
      return
    }
    const newAffiliations = selectedAffiliations
      .map((a) => a.id)
      .filter((id) => id !== affId)
    setSelectedAffiliations(
      affiliations.filter((item) => newAffiliations.includes(item.id))
    )
  }
  const selectAffiliation = (affiliationId: string) => {
    if (!selection) {
      return
    }

    const currentAffiliations = selectedAffiliations.map((a) => a.id)
    const isAlreadySelected = currentAffiliations.includes(affiliationId)

    const newAffiliations = isAlreadySelected
      ? currentAffiliations.filter((id) => id !== affiliationId)
      : [...currentAffiliations, affiliationId]

    setSelectedAffiliations(
      affiliations.filter((item) => newAffiliations.includes(item.id))
    )
  }
  return {
    showAffiliationDrawer,
    setShowAffiliationDrawer,
    selectedAffiliations,
    setSelectedAffiliations,
    removeAffiliation,
    selectAffiliation,
    affiliations,
  }
}
