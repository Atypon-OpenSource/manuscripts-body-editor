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
  TextArea,
} from '@manuscripts/style-guide'
import { Target } from '@manuscripts/transform'
import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  padding: ${(props) => props.theme.grid.unit * 3}px
    ${(props) => props.theme.grid.unit * 4}px;
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
  margin: ${(props) => props.theme.grid.unit * 4}px 0;
`

const CrossReferenceItem = styled.div<{ isSelected: boolean }>`
  position: relative;
  cursor: pointer;
  padding: ${(props) => props.theme.grid.unit * 4}px;
  background-color: ${(props) =>
    props.isSelected
      ? props.theme.colors.background.selected
      : props.theme.colors.background.primary};
  transition: background-color 0.1s;
  border: solid
    ${(props) =>
      props.isSelected
        ? props.theme.colors.brand.medium
        : props.theme.colors.border.secondary};
  border-width: 1px 0;
  margin-top: -1px;
  z-index: ${(props) => (props.isSelected ? '1' : '0')};

  &:first-child {
    margin-top: 0;
  }

  &:hover {
    background-color: ${(props) => props.theme.colors.background.selected};
  }
`

const Label = styled.span`
  color: ${(props) => props.theme.colors.text.primary};
`

const Caption = styled.span`
  color: ${(props) => props.theme.colors.text.secondary};
`

const Heading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  font-weight: ${(props) => props.theme.font.weight.bold};
`

const Empty = styled.div`
  margin-bottom: ${(props) => props.theme.grid.unit * 4}px;
  color: ${(props) => props.theme.colors.text.tertiary};
`
const DefaultLabelWrapper = styled.div`
  margin-bottom: ${(props) => props.theme.grid.unit * 2}px;
`

const CustomTextArea = styled(TextArea)`
  width: 100%;
  height: 75px;
  color: ${(props) => props.theme.colors.text.secondary};
  background-color: ${(props) =>
    props.theme.colors.background.primary} !important;
  border: 1px solid ${(props) => props.theme.colors.border.secondary};
  border-radius: ${(props) => props.theme.grid.radius.small};
  padding: ${(props) => props.theme.grid.unit * 2}px;
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
  targets: Target[]
  handleSelect: (id: string, customLabel?: string) => void
  handleCancel: () => void
  currentTargetId?: string
  currentCustomLabel?: string
}

export const CrossReferenceItems: React.FC<Props> = ({
  targets,
  handleSelect,
  handleCancel,
  currentTargetId,
  currentCustomLabel,
}) => {
  const [selectedItem, setSelectedItem] = useState<string>('')
  const customTextRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (currentTargetId) {
      setSelectedItem(currentTargetId)
    }
  }, [currentTargetId])

  return (
    <Container>
      <Heading>Insert Cross-reference</Heading>

      <Items>
        {targets.length ? (
          targets.map((target) => (
            <CrossReferenceItem
              key={target.id}
              isSelected={selectedItem === target.id}
              onMouseDown={() => setSelectedItem(target.id)}
            >
              <DefaultLabelWrapper>
                <Label>{target.label}</Label>
                <Caption>
                  {target.caption && ': ' + trimmedCaption(target.caption, 200)}
                </Caption>
              </DefaultLabelWrapper>
              {selectedItem === target.id && (
                <CustomTextArea
                  ref={customTextRef}
                  placeholder={'Or type custom text'}
                  defaultValue={
                    currentTargetId &&
                    currentTargetId === selectedItem &&
                    currentCustomLabel
                      ? currentCustomLabel
                      : ''
                  }
                />
              )}
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
            onClick={() =>
              selectedItem &&
              handleSelect(
                selectedItem,
                customTextRef.current?.value || ''
              )
            }
            disabled={!selectedItem}
          >
            Insert
          </PrimaryButton>
        </ButtonGroup>
      </Actions>
    </Container>
  )
}
