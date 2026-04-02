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
import { AuthorPlaceholderIcon } from '@manuscripts/style-guide'
import React from 'react'

import {
  GenericPanel,
  ListItem,
  ListItems,
  useListSelectedIds,
} from '../authors-affiliations/GenericPanel'

export interface AuthorsPanelProps {
  items: { id: string; label: string }[]
  selectedItems?: { id: string }[]
  onSelect: (id: string) => void
  onOpenAuthorsModal: () => void
}

export const AuthorsPanel: React.FC<AuthorsPanelProps> = ({
  items,
  selectedItems = [],
  onSelect,
  onOpenAuthorsModal,
}) => {
  const selectedIds = useListSelectedIds(selectedItems)

  return (
    <GenericPanel
      title="Authors"
      createLabel="Add New Author"
      onCreate={onOpenAuthorsModal}
      createDataCy="add-authors-link"
      emptyDataCy="authors-panel-empty"
      isEmpty={items.length === 0}
      emptyIcon={<AuthorPlaceholderIcon />}
      emptyMessage={
        <>
          There are no authors attributed yet!
          <br />
          Click &lsquo;Add New Author&rsquo;
        </>
      }
    >
      <ListItems>
        {items.map((item) => (
          <ListItem
            key={item.id}
            selected={selectedIds.has(item.id)}
            onClick={() => onSelect(item.id)}
            primary={item.label}
          />
        ))}
      </ListItems>
    </GenericPanel>
  )
}
