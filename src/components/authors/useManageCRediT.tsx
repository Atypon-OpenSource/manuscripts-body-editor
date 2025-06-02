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
import { CRediTRole, CreditVocabTerm } from '@manuscripts/transform'
import { useEffect, useMemo, useState } from 'react'

import { ContributorAttrs } from '../../lib/authors'

export const useManageCRediT = (selection: ContributorAttrs | undefined) => {
  const vocabTermItems = useMemo(() => {
    return Object.values(CreditVocabTerm).map((c) => ({
      vocabTerm: c,
      id: c,
    }))
  }, [])

  useEffect(() => {
    setSelectedCRediTRoles(selection?.CRediTRoles ? selection?.CRediTRoles : [])
  }, [selection])

  const [selectedCRediTRoles, setSelectedCRediTRoles] = useState<CRediTRole[]>(
    []
  )

  const selectCRediTRole = (role: string) => {
    setSelectedCRediTRoles((prev) => {
      const clear = prev.filter((t) => t.vocabTerm !== role)
      if (clear.length !== prev.length) {
        return clear
      }
      const newTerm = vocabTermItems.find((t) => t.vocabTerm === role)
      if (newTerm) {
        return [...prev, { vocabTerm: newTerm.vocabTerm }]
      }
      return prev
    })
  }

  const removeCRediTRole = (role: string) => {
    setSelectedCRediTRoles((prev) => {
      return prev.filter((r) => r.vocabTerm !== role)
    })
  }
  return {
    removeCRediTRole,
    selectCRediTRole,
    selectedCRediTRoles,
    setSelectedCRediTRoles,
    vocabTermItems,
  }
}
