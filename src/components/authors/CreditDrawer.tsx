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
  CheckboxField,
  CheckboxLabel,
  Drawer,
  DrawerItemsList,
  DrawerProps,
  LabelText,
} from '@manuscripts/style-guide'
import React from 'react'
import styled from 'styled-components'

import { CheckboxContainer } from './AuthorDetailsForm'

interface CreditDrawerProps {
  items: { id: string; vocabTerm: string }[]
  selectedItems: {
    id: string
  }[]
  onSelect: (id: string) => void
}

export const CreditDrawer: React.FC<
  CreditDrawerProps & Omit<DrawerProps, 'children'>
> = ({ items, selectedItems = [], onSelect, ...drawerProps }) => {
  return (
    <Drawer {...drawerProps}>
      <TwoColumnContainer>
        {items.map((item, i) => (
          <TwoColumnCheckbox key={item.id}>
            <CheckboxLabel>
              <CheckboxField
                id={'credit-role-' + i}
                name={item.id}
                checked={selectedItems?.map((a) => a.id).includes(item.id)}
                onChange={() => {
                  onSelect(item.id)
                }}
              />
              <LabelText>{item.vocabTerm}</LabelText>
            </CheckboxLabel>
          </TwoColumnCheckbox>
        ))}
      </TwoColumnContainer>
    </Drawer>
  )
}

const TwoColumnContainer = styled(DrawerItemsList)`
  display: flex;
  flex-flow: row wrap;
  padding: 0 ${(props) => props.theme.grid.unit * 4}px;
  position: relative;

  &:after {
    content: '';
    display: block;
    border-bottom: 1px solid #f0f0f0;
    min-width: 100%;
    padding-top: 16px;
  }
`
const TwoColumnCheckbox = styled(CheckboxContainer)`
  flex 1 0 50%;
`
