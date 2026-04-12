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
import { AffiliationPlaceholderIcon } from '@manuscripts/style-guide'
import React from 'react'

import { AffiliationAttrs } from '../../lib/authors'
import {
  GenericPanel,
  ListItem,
  ListItems,
  useListSelectedIds,
} from '../authors-affiliations/GenericPanel'

export interface AffiliationsPanelProps {
  items: AffiliationAttrs[]
  selectedItems: { id: string }[]
  onSelect: (id: string) => void
  onOpenAffiliationsModal: () => void
}

function affiliationSecondaryLine(item: AffiliationAttrs): string | undefined {
  const line = [item.city, item.county, item.country].filter(Boolean).join(', ')
  return line || undefined
}

export const AffiliationsPanel: React.FC<AffiliationsPanelProps> = ({
  items,
  selectedItems = [],
  onSelect,
  onOpenAffiliationsModal,
}) => {
  const selectedIds = useListSelectedIds(selectedItems)

  return (
    <GenericPanel
      title="Institutional Affiliations"
      createLabel="Create New Affiliation"
      onCreate={onOpenAffiliationsModal}
      createDataCy="add-affiliations-link"
      emptyDataCy="affiliations-panel-empty"
      isEmpty={items.length === 0}
      emptyIcon={<AffiliationPlaceholderIcon />}
      emptyMessage={
        <>
          There are no affiliations attributed yet!
          <br />
          Click &lsquo;Create New Affiliation&rsquo;
        </>
      }
    >
      <ListItems>
        {items.map((item) => (
          <ListItem
            key={item.id}
            selected={selectedIds.has(item.id)}
            onClick={() => onSelect(item.id)}
            primary={item.institution}
            secondary={affiliationSecondaryLine(item)}
          />
        ))}
      </ListItems>
    </GenericPanel>
  )
}
