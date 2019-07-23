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

import { Button, PrimaryButton } from '@manuscripts/style-guide'
import React from 'react'
import styled from 'styled-components'
import { Target } from '../../plugins/objects'

const Container = styled.div`
  padding: 12px 16px;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`

const CrossReferenceItem = styled.div<{ isSelected: boolean }>`
  cursor: pointer;
  padding: 16px;
  transition: background-color 0.1s;
  border: 2px solid ${props => (props.isSelected ? '#7fb5d5' : '#eee')};
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

const Heading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`

const Empty = styled.div`
  margin-bottom: 16px;
  color: #a6a6a6;
`
interface Props {
  referencedObject: string | null
  targets: Target[]
  handleSelect: (id: string) => void
  handleCancel: () => void
}

interface State {
  selectedItem: string | null
}

export class CrossReferenceItems extends React.Component<Props, State> {
  public state: Readonly<State> = {
    selectedItem: null,
  }

  public render() {
    const { targets, handleCancel, handleSelect } = this.props

    return (
      <Container>
        <Heading>Insert Cross-reference</Heading>
        {targets.length ? (
          targets.map(target => (
            <CrossReferenceItem
              key={target.id}
              isSelected={this.state.selectedItem === target.id}
              onMouseDown={() =>
                this.setState({
                  selectedItem: target.id,
                })
              }
            >
              <Label>{target.label}</Label>
              <Caption>{target.caption && ': ' + target.caption}</Caption>
            </CrossReferenceItem>
          ))
        ) : (
          <Empty>No cross-reference targets available.</Empty>
        )}
        <Actions>
          <Button onClick={handleCancel}>Cancel</Button>
          <PrimaryButton
            onClick={() => handleSelect(this.state.selectedItem!)}
            disabled={!this.state.selectedItem}
          >
            Insert
          </PrimaryButton>
        </Actions>
      </Container>
    )
  }
}
