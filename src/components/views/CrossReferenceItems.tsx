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
  CloseButton,
  ExpandableSection,
  PrimaryButton,
  withListNavigation,
  withNavigableListItem,
  FileUnknownIcon,
  getFileIcon,
  ArrowDownIcon,
  ModalContainer,
  ModalHeader,
  ModalBody,
  WebLinkIcon,
  StyledModalContent,
} from '@manuscripts/style-guide'
import { Target, schema } from '@manuscripts/transform'
import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { FileAttachment } from '../../lib/files'
import { allowedHref } from '../../lib/url'
import { nodeTypeIcon } from '../../node-type-icons'
import FormFooter from '../form/FormFooter'

const Items = withListNavigation(styled.div`
  flex: 1;
  overflow-y: auto;
`)

const CrossReferenceItem = withNavigableListItem(styled.div`
  cursor: pointer;
  padding: ${(props) => props.theme.grid.unit * 2}px;
  background-color: ${(props) => props.theme.colors.background.primary};
  transition: background-color 0.1s;
  border: 1px solid ${(props) => props.theme.colors.border.secondary};
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
  margin-bottom: ${(props) => props.theme.grid.unit * 2}px;

  &:hover {
    background-color: #f2f2f2;
  }

  &.active {
    background-color: #f2f2f2;
    z-index: 1;
  }
`)

const Label = styled.span`
  color: ${(props) => props.theme.colors.text.primary};
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  overflow-wrap: break-word;
  min-width: fit-content;
`

const Caption = styled.span`
  color: ${(props) => props.theme.colors.text.secondary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  overflow-wrap: break-word;
  margin-left: 3.2px;
`

const Heading = styled.div`
  font-size: ${(props) => props.theme.font.size.medium};
  font-weight: ${(props) => props.theme.font.weight.bold};
  color: ${(props) => props.theme.colors.text.primary};
  margin-bottom: ${(props) => props.theme.grid.unit * 3}px;
`

const Empty = styled.div`
  margin-bottom: ${(props) => props.theme.grid.unit * 4}px;
  color: ${(props) => props.theme.colors.text.tertiary};
`

const GroupExpandableSection = styled(ExpandableSection)`
  & > div:first-child {
    flex-direction: row-reverse;
    justify-content: flex-end;
    padding-left: 0;
    gap: 10px;
    font-weight: ${(props) => props.theme.font.weight.normal};
    svg {
      width: 20px;
      height: 20px;
    }
  }
`
const DefaultLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`

const ItemIcon = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: ${(props) => props.theme.colors.text.secondary};
  margin-right: ${(props) => props.theme.grid.unit * 2}px;
  svg {
    width: 20px;
    height: 20px;
  }
`

const FieldLabel = styled.label`
  font-size: ${(props) => props.theme.font.size.normal};
  color: ${(props) => props.theme.colors.text.secondary};
  margin-top: ${(props) => props.theme.grid.unit * 4}px;
  margin-bottom: ${(props) => props.theme.grid.unit}px;
`

const CustomTextInput = styled.input`
  color: ${(props) => props.theme.colors.text.secondary};
  background-color: ${(props) => props.theme.colors.background.primary};
  border: 1px solid ${(props) => props.theme.colors.border.secondary};
  border-radius: ${(props) => props.theme.grid.radius.small};
  padding: ${(props) => props.theme.grid.unit * 2}px;
  &:disabled {
    cursor: not-allowed;
    background-color: ${(props) => props.theme.colors.background.disabled};
    color: ${(props) => props.theme.colors.text.muted};
  }
`
const StyledModalBody = styled(ModalBody)`
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.theme.grid.unit * 5}px
    ${(props) => props.theme.grid.unit * 6}px;
  max-height: 580px;
  min-width: 600px;
  max-width: 600px;
  overflow: hidden;
`

// trim a caption, avoiding cutting words
const trimmedCaption = (caption: string, limit: number): string => {
  if (caption.length <= limit) {
    return caption
  }

  const captionSearch = new RegExp(`^(.{${limit}}[^\\s]*).*`)

  return caption.replace(captionSearch, '$1…')
}

const getTargetIcon = (
  target: Target,
  files: FileAttachment[]
): React.ReactNode => {
  if (target.type === schema.nodes.supplement.name) {
    if (target.href && allowedHref(target.href)) {
      return <WebLinkIcon className="file-icon" />
    }
    const fileName =
      files.find((f) => f.id === target.href)?.name ?? target.label ?? ''
    return getFileIcon(fileName) ?? <FileUnknownIcon />
  }

  return nodeTypeIcon(schema.nodes[target.type])
}

const GROUP_LABELS: Record<string, string> = {
  figure_element: 'Figures',
  table_element: 'Tables',
  equation_element: 'Equations',
  listing_element: 'Listings',
  box_element: 'Boxes',
  embed: 'Media',
  supplement: 'Supplementary files',
}

export interface CrossReferenceItemsProps {
  targets: Target[]
  files: FileAttachment[]
  handleSelect: (id: string, customLabel?: string) => void
  handleCancel: () => void
  currentTargetId?: string
  currentCustomLabel?: string
  isEdit?: boolean
  onClose: () => void
}

export const CrossReferenceItems: React.FC<CrossReferenceItemsProps> = ({
  targets,
  files,
  handleSelect,
  handleCancel,
  currentTargetId,
  currentCustomLabel,
  isEdit = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedItem, setSelectedItem] = useState<string>('')
  const customTextRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentTargetId) {
      setSelectedItem(currentTargetId)
    }
  }, [currentTargetId])

  const close = () => setIsOpen(false)

  const grouped = targets.reduce<Record<string, Target[]>>((acc, t) => {
    ;(acc[t.type] ??= []).push(t)
    return acc
  }, {})

  return (
    <StyledModalContent
      isOpen={isOpen}
      onExited={() => {
        onClose()
        console.log('exited')
        handleCancel()
      }}
      onRequestClose={close}
      shouldCloseOnOverlayClick={true}
    >
      <ModalContainer data-cy="cross-reference-editor">
        <ModalHeader>
          <CloseButton onClick={close} />
        </ModalHeader>
        <StyledModalBody>
          <Heading>
            {isEdit ? 'Edit Cross-reference' : 'Insert Cross-reference'}
          </Heading>

          <FieldLabel htmlFor="cross-reference-custom-text">
            Custom display text
          </FieldLabel>
          <CustomTextInput
            ref={customTextRef}
            id="cross-reference-custom-text"
            data-cy="cross-reference-custom-text"
            type="text"
            placeholder={'Custom display text...'}
            disabled={!selectedItem}
            defaultValue={currentCustomLabel ?? ''}
          />

          <Items>
            {Object.keys(grouped).length ? (
              Object.entries(grouped).map(([type, group]) => (
                <GroupExpandableSection
                  key={type}
                  title={GROUP_LABELS[type]}
                  icon={ArrowDownIcon}
                >
                  {group.map((target) => {
                    const icon = getTargetIcon(target, files)

                    return (
                      <CrossReferenceItem
                        key={target.id}
                        data-cy="cross-reference-item"
                        className={
                          selectedItem === target.id ? 'active' : undefined
                        }
                        onClick={() => setSelectedItem(target.id)}
                      >
                        <DefaultLabelWrapper>
                          {icon ? <ItemIcon>{icon}</ItemIcon> : null}
                          <Label>
                            {target.label}
                            {target.caption && `:`}
                          </Label>
                          <Caption>
                            {trimmedCaption(target.caption, 200)}
                          </Caption>
                        </DefaultLabelWrapper>
                      </CrossReferenceItem>
                    )
                  })}
                </GroupExpandableSection>
              ))
            ) : (
              <Empty>No cross-reference targets available.</Empty>
            )}
          </Items>
        </StyledModalBody>
        <FormFooter
          onCancel={close}
          cancelLabel="Cancel"
          primaryAction={
            <PrimaryButton
              onClick={() => {
                if (selectedItem) {
                  setIsOpen(false)
                  const customLabel = customTextRef.current?.value
                  handleSelect(selectedItem, customLabel || '')
                }
              }}
              disabled={!selectedItem}
            >
              {isEdit ? 'Update' : 'Insert'}
            </PrimaryButton>
          }
        />
      </ModalContainer>
    </StyledModalContent>
  )
}
