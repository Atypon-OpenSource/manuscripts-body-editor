/*!
 * © 2023 Atypon Systems LLC
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
  AddNewIcon,
  ButtonGroup,
  CloseButton,
  IconTextButton,
  ModalContainer,
  ModalHeader,
  ModalSidebar,
  ModalSidebarHeader,
  ModalSidebarTitle,
  PrimaryButton,
  SidebarContent,
  StyledModal,
  TertiaryButton,
  withFocusTrap,
} from '@manuscripts/style-guide'
import { BibliographyItemAttrs } from '@manuscripts/transform'
import { debounce } from 'lodash'
import React, { useState } from 'react'
import styled from 'styled-components'

import { StyledModalBody } from '../form/CreateModalStyles'
import {
  BibliographyItemSource,
  DocumentReferenceSource,
} from './BibliographyItemSource'
import { ReferenceSearchSection } from './ReferenceSearchSection'
import { SearchInput } from './SearchInput'

const Container = withFocusTrap(ModalContainer)

const StyledModalSidebar = styled(ModalSidebar)`
  background: white;
  width: 35vw;
  padding: ${(props) => props.theme.grid.unit * 6}px;
`

const StyledSidebarContent = styled(SidebarContent)`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.grid.unit * 4}px;
  padding: 6px;
`

const StyledSidebarHeader = styled(ModalSidebarHeader)`
  padding: 0;
`

const InsertCitationButton = styled(IconTextButton)`
  svg {
    margin-right: ${(props) => props.theme.grid.unit * 2}px;
  }
`

const Actions = styled(ButtonGroup)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${(props) => props.theme.grid.unit * 4}px 0;
`

export const InsertCitationModal: React.FC<{
  query?: string
  sources: BibliographyItemSource[]
  items: BibliographyItemAttrs[]
  onAdd: () => void
  onCite: (items: BibliographyItemAttrs[]) => void
  onCancel: () => void
}> = ({ query: initialQuery, sources, items, onAdd, onCite, onCancel }) => {
  const [isOpen, setOpen] = useState(true)
  const [query, setQuery] = useState<string>(initialQuery || '')
  const [selections, setSelections] = useState(
    new Map<string, BibliographyItemAttrs>()
  )

  const handleClose = () => {
    onCancel()
    setOpen(false)
  }

  const toggleSelection = (item: BibliographyItemAttrs) => {
    const id = item.id
    if (selections.has(id)) {
      selections.delete(id)
      setSelections(new Map([...selections]))
    } else {
      selections.set(id, item)
      setSelections(new Map([...selections]))
    }
  }

  const isSelected = (item: BibliographyItemAttrs) => {
    return selections.has(item.id)
  }

  const document = new DocumentReferenceSource(items)

  const handleClick = () => {
    const items = Array.from(selections.values())
    return onCite(items)
  }

  const debouncedSetQuery = debounce((e) => {
    setQuery(e.target.value.trim())
  }, 800)

  return (
    <StyledModal
      isOpen={isOpen}
      onRequestClose={handleClose}
      shouldCloseOnOverlayClick={true}
    >
      <Container data-cy={'reference-finder'}>
        <ModalHeader>
          <CloseButton onClick={handleClose} data-cy="modal-close-button" />
        </ModalHeader>
        <StyledModalBody>
          <StyledModalSidebar>
            <StyledSidebarHeader>
              <ModalSidebarTitle>Insert Citation</ModalSidebarTitle>
            </StyledSidebarHeader>
            <StyledSidebarContent>
              <SearchInput
                onChange={debouncedSetQuery}
                defaultValue={initialQuery}
              />
              <ReferenceSearchSection
                key={document.id}
                query={query}
                source={document}
                isSelected={isSelected}
                onSelect={toggleSelection}
              />
              {query.length
                ? sources.map((source) => (
                    <ReferenceSearchSection
                      key={source.id}
                      query={query}
                      source={source}
                      isSelected={isSelected}
                      onSelect={toggleSelection}
                    />
                  ))
                : ''}
            </StyledSidebarContent>
            <Actions>
              <InsertCitationButton onClick={onAdd}>
                <AddNewIcon />
                Add new
              </InsertCitationButton>
              <ButtonGroup>
                <TertiaryButton onClick={handleClose}>Cancel</TertiaryButton>
                <PrimaryButton
                  onClick={handleClick}
                  disabled={selections.size === 0}
                >
                  Insert Citation
                </PrimaryButton>
              </ButtonGroup>
            </Actions>
          </StyledModalSidebar>
        </StyledModalBody>
      </Container>
    </StyledModal>
  )
}
