/*!
 * © 2019 Atypon Systems LLC
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

import React from 'react'
import styled from 'styled-components'

import { AffiliationAttrs } from '../../lib/authors'
import { AffiliationItem } from './AffiliationItem'
import { withListNavigation } from '@manuscripts/style-guide'

const AffiliationListContainer = withListNavigation(styled.div`
  flex: 1;
  overflow-y: visible;
`)
const AffiliationListTitle = styled.h2`
  color: #6e6e6e;
  font-size: 18px;
  font-weight: 400;
  line-height: 24px;
`

interface AffiliationListProps {
  affiliation?: AffiliationAttrs
  affiliations: AffiliationAttrs[]
  onSelect: (item: AffiliationAttrs) => void
  onDelete: () => void
  lastSavedAffiliationId?: string
}

export const AffiliationList: React.FC<AffiliationListProps> = ({
  affiliation,
  affiliations,
  onSelect,
  onDelete,
  lastSavedAffiliationId,
}) => {
  return (
    <>
      <AffiliationListTitle>Existing Affiliations</AffiliationListTitle>
      <AffiliationListContainer data-cy="affiliation-list">
        {affiliations.map((a) => {
          return (
            <AffiliationItem
              key={a.id}
              affiliation={a}
              isSelected={a.id === affiliation?.id}
              onClick={() => {
                return onSelect(a)
              }}
              onDelete={() => onDelete()}
              showSuccessIcon={lastSavedAffiliationId === a.id}
            />
          )
        })}
      </AffiliationListContainer>
    </>
  )
}
