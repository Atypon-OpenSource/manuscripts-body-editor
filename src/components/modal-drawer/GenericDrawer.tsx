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
import {
  AddedIcon,
  AddIcon,
  Drawer,
  DrawerIcon,
  DrawerItemLabel,
  DrawerItemsList,
  DrawerLabelContainer,
  DrawerListItem,
  DrawerProps,
} from '@manuscripts/style-guide'
import React from 'react'

interface GenericDrawerProps {
  items: { id: string; label: string }[]
  selectedItems: {
    id: string
  }[]
  onSelect: (id: string) => void
}

export const GenericDrawer: React.FC<
  GenericDrawerProps & Omit<DrawerProps, 'children'>
> = ({ items, selectedItems = [], onSelect, ...drawerProps }) => {
  return (
    <Drawer {...drawerProps}>
      <DrawerItemsList>
        {items.map((item) => (
          <DrawerListItem
            data-cy="item"
            key={item.id}
            selected={selectedItems?.map((a) => a.id).includes(item.id)}
            onClick={() => onSelect(item.id)}
          >
            <DrawerIcon>
              {selectedItems?.map((a) => a.id).includes(item.id) ? (
                <AddedIcon width={22} height={22} />
              ) : (
                <AddIcon width={22} height={22} />
              )}
            </DrawerIcon>
            <DrawerLabelContainer>
              <DrawerItemLabel>{item.label}</DrawerItemLabel>
            </DrawerLabelContainer>
          </DrawerListItem>
        ))}
      </DrawerItemsList>
    </Drawer>
  )
}
