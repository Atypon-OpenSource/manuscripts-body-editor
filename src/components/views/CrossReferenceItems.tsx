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
import { Target } from '../../plugins/objects'

const Container = styled.div`
  padding: 12px 16px;
`

const CrossReferenceItem = styled.div<{ isSelected: boolean }>`
  cursor: pointer;
  padding: 16px 32px;
  transition: background-color 0.1s;
  border: 2px solid ${props => (props.isSelected ? 'yellow' : '#eee')};
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin-bottom: 16px;

  &:hover {
    border-color: #6fb7ff;
  }
`

const Label = styled.span`
  font-weight: bold;
`

const Caption = styled.span`
  font-style: italic;
`

interface Props {
  referencedObject: string | null
  targets: Target[]
  handleSelect: (id: string) => void
}

export const CrossReferenceItems: React.FunctionComponent<Props> = ({
  handleSelect,
  referencedObject,
  targets,
}) => (
  <Container>
    {targets.length ? (
      targets.map(target => (
        <CrossReferenceItem
          key={target.id}
          isSelected={referencedObject === target.id}
          onMouseDown={() => handleSelect(target.id)}
        >
          <Label>{target.label}:</Label> <Caption>{target.caption}</Caption>
        </CrossReferenceItem>
      ))
    ) : (
      <div>No targets available.</div>
    )}
  </Container>
)
