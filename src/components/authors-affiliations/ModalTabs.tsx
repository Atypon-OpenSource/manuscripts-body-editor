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

import {
  InspectorTab,
  InspectorTabList,
} from '@manuscripts/style-guide'
import React from 'react'
import styled from 'styled-components'

export interface ModalTabsProps {
  tabLabels: string[]
}

export const ModalTabs: React.FC<ModalTabsProps> = ({ tabLabels }) => (
  <StyledTabList>
    {tabLabels.map((label) => (
      <StyledTab key={label}>
        {label}
      </StyledTab>
    ))}
  </StyledTabList>
)

const StyledTab = styled(InspectorTab)`
  border-radius: 14px;
  flex: 1;

  &[aria-selected='true'] {
    background: ${(props) => props.theme.colors.background.primary};
    border: unset;
    color: ${(props) => props.theme.colors.text.primary} !important;
    font-weight: 700;
  }
`

const StyledTabList = styled(InspectorTabList)`
  display: flex;
  justify-content: space-evenly;
  border-radius: 14px;
  background: #e2e2e2 !important;
  padding: 2px;
`
