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

import AttentionOrange from '@manuscripts/assets/react/AttentionOrange'
import SuccessGreen from '@manuscripts/assets/react/SuccessGreen'
import {
  ManuscriptNode,
  nodeTitle,
  nodeTitlePlaceholder,
} from '@manuscripts/transform'
import React from 'react'
import styled from 'styled-components'

import { nodeTypeIcon } from '../../node-type-icons'
import { OutlineItemIcon } from '../outline/Outline'
import { RequirementsAlerts } from './RequirementsProvider'

const IconContainer = styled.div`
  display: inline-flex;
  align-items: center;
  width: ${(props) => props.theme.grid.unit * 5}px;
  margin-right: ${(props) => props.theme.grid.unit}px;
`

const CheckContainer = styled.div`
  display: flex;
  align-items: center;
  margin: ${(props) => props.theme.grid.unit * 2}px 0;
  padding-left: ${(props) => props.theme.grid.unit * 4}px;

  &:not(:last-child) {
    margin-bottom: 8px;
  }
`

const Check: React.FC<{
  message: string
  passed: boolean
}> = ({ message, passed }) => (
  <CheckContainer>
    <IconContainer>
      {passed ? (
        <SuccessGreen width={16} height={16} />
      ) : (
        <AttentionOrange width={16} height={16} />
      )}
    </IconContainer>

    {message}
  </CheckContainer>
)

const Header = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
`

const nodeText = (node: ManuscriptNode) => {
  const text = nodeTitle(node)

  return text ? text.trim() : nodeTitlePlaceholder(node.type)
}

export const Checks: React.FC<{
  node: ManuscriptNode
  alerts: RequirementsAlerts
}> = ({ node, alerts }) => {
  const icon = nodeTypeIcon(node.type)
  const text = nodeText(node)

  return (
    <Container>
      {icon && (
        <Header>
          <OutlineItemIcon>{icon}</OutlineItemIcon>
          {text}
        </Header>
      )}

      {Object.values(alerts).map((alert, index) => (
        <Check message={alert.message} passed={alert.passed} key={index} />
      ))}
    </Container>
  )
}

const Container = styled.div`
  margin-bottom: 16px;
`
