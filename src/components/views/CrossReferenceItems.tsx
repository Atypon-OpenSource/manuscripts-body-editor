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

import {
  ButtonGroup,
  PrimaryButton,
  SecondaryButton,
} from '@manuscripts/style-guide'
import React from 'react'
import styled from 'styled-components'
import { Target } from '../../plugins/objects'

const Container = styled.div`
  padding: ${props => props.theme.grid.unit * 3}px
    ${props => props.theme.grid.unit * 4}px;
  display: flex;
  flex-direction: column;
  max-height: 60vh;
  overflow: hidden;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
`

const Items = styled.div`
  flex: 1;
  overflow-y: auto;
  margin: ${props => props.theme.grid.unit * 4}px 0;
`

const CrossReferenceItem = styled.div<{ isSelected: boolean }>`
  cursor: pointer;
  padding: ${props => props.theme.grid.unit * 4}px;
  transition: background-color 0.1s;
  border: 2px solid
    ${props =>
      props.isSelected
        ? props.theme.colors.brand.medium
        : props.theme.colors.border.secondary};
  box-shadow: ${props => props.theme.shadow.dropShadow};
  border-radius: ${props => props.theme.grid.radius.small};
  margin-bottom: ${props => props.theme.grid.unit * 4}px;

  &:hover {
    border-color: ${props => props.theme.colors.background.fifth};
  }
`

const Label = styled.span`
  font-weight: ${props => props.theme.font.weight.bold};
`

const Caption = styled.span`
  font-style: italic;
`

const Heading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  font-weight: ${props => props.theme.font.weight.bold};
`

const Empty = styled.div`
  margin-bottom: ${props => props.theme.grid.unit * 4}px;
  color: ${props => props.theme.colors.text.tertiary};
`

// trim a caption, avoiding cutting words
const trimmedCaption = (caption: string, limit: number): string => {
  if (caption.length <= limit) {
    return caption
  }

  const captionSearch = new RegExp(`^(.{${limit}}[^\\s]*).*`)

  return caption.replace(captionSearch, '$1…')
}

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

        <Items>
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
                <Caption>
                  {target.caption && ': ' + trimmedCaption(target.caption, 200)}
                </Caption>
              </CrossReferenceItem>
            ))
          ) : (
            <Empty>No cross-reference targets available.</Empty>
          )}
        </Items>

        <Actions>
          <ButtonGroup>
            <SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
            <PrimaryButton
              onClick={() => handleSelect(this.state.selectedItem!)}
              disabled={!this.state.selectedItem}
            >
              Insert
            </PrimaryButton>
          </ButtonGroup>
        </Actions>
      </Container>
    )
  }
}
