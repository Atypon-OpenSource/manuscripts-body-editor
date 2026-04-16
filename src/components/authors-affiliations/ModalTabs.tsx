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

import { InspectorTab, InspectorTabList } from '@manuscripts/style-guide'
import React from 'react'
import styled from 'styled-components'

export interface ModalTabsProps {
  tabLabels: string[]
  tabErrorIndicators?: boolean[]
  tabWarningIndicators?: boolean[]
}

export const ModalTabs: React.FC<ModalTabsProps> = ({
  tabLabels,
  tabErrorIndicators,
  tabWarningIndicators,
}) => (
  <StyledTabList>
    {tabLabels.map((label, i) => {
      const hasError = tabErrorIndicators?.[i]
      const showWarning = tabWarningIndicators?.[i] && !hasError
      return (
        <StyledTab key={label}>
          {label}
          {(showWarning || hasError) && (
            <TabIndicatorGroup role="presentation">
              {showWarning ? <TabWarningDot aria-hidden /> : null}
              {hasError ? <TabErrorDot aria-hidden /> : null}
            </TabIndicatorGroup>
          )}
        </StyledTab>
      )
    })}
  </StyledTabList>
)

const TabIndicatorGroup = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 6px;
  flex-shrink: 0;
`

const TabErrorDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cf1322;
  flex-shrink: 0;
  vertical-align: middle;
`

const TabWarningDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => props.theme.colors.text.warning};
  flex-shrink: 0;
  vertical-align: middle;
`

const StyledTab = styled(InspectorTab)`
  border-radius: 14px;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;

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
