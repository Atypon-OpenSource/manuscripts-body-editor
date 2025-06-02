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

import React from 'react'
import { DrawerProps, SelectedItemsBox } from '@manuscripts/style-guide'
import styled from 'styled-components'
import { PartialExcept } from '../../types'

type Base = {
  id: string
} & Record<string, any>

interface DrawerGroupProps<T extends Base> {
  removeItem: (id: string) => void
  selectedItems: PartialExcept<T, 'id'>[]
  items: T[]
  showDrawer: boolean
  setShowDrawer: (on: boolean) => void
  onSelect: (id: string) => void
  title: string
  labelField: keyof T
  Drawer: React.ComponentType<
    EmbeddedDrawerProps<T> & Omit<DrawerProps, 'children'>
  >
  cy: string
  buttonText: string
  Icon?: React.ReactNode
}

interface EmbeddedDrawerProps<T extends Base> {
  items: T[]
  selectedItems: DrawerGroupProps<T>['selectedItems']
  onSelect: (id: string) => void
}

export function DrawerGroup<T extends Base>({
  removeItem,
  selectedItems,
  onSelect,
  items,
  showDrawer,
  setShowDrawer,
  title,
  labelField,
  Drawer,
  cy,
  Icon,
  buttonText,
}: DrawerGroupProps<T>) {
  return (
    <>
      <DrawerSection>
        <DrawerSectionHeader>
          <DrawerSectionTitle>{title}</DrawerSectionTitle>
          <AssignButton
            onClick={() => setShowDrawer(true)}
            data-cy={cy + 'assign-button'}
          >
            {Icon}
            {buttonText}
          </AssignButton>
        </DrawerSectionHeader>
        <SelectedItemsBox
          data-cy={cy + '-selected-items'}
          items={selectedItems.map((i) => ({
            id: i.id || '',
            label: (i as T)[labelField] ?? '',
          }))}
          onRemove={removeItem}
          placeholder={`No ${title}s assigned`}
        />
      </DrawerSection>
      {showDrawer && (
        <Drawer
          items={items}
          selectedItems={selectedItems}
          title={title}
          onSelect={onSelect}
          onBack={() => setShowDrawer(false)}
          width="100%"
        />
      )}
    </>
  )
}

const DrawerSectionTitle = styled.h3`
  margin: 0;
  font-weight: ${(props) => props.theme.font.weight.normal};
  font-size: ${(props) => props.theme.font.size.large};
  font-family: ${(props) => props.theme.font.family.sans};
  color: ${(props) => props.theme.colors.text.secondary};
`
export const AssignButton = styled.button`
  color: ${(props) => props.theme.colors.brand.default};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font: ${(props) => props.theme.font.weight.normal}
    ${(props) => props.theme.font.size.normal}
    ${(props) => props.theme.font.family.sans};
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: ${(props) => props.theme.grid.unit * 2}px;
  &:hover {
    opacity: 0.8;
  }
`
export const DrawerSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;
  margin-bottom: ${(props) => props.theme.grid.unit * 2}px;
`
export const DrawerSection = styled.div`
  margin-top: ${(props) => props.theme.grid.unit * 4}px;
  padding-top: ${(props) => props.theme.grid.unit * 4}px;
  border-top: 1px solid ${(props) => props.theme.colors.border.tertiary};
`
