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
  Category,
  CitationCountIcon,
  CloseButton,
  Dialog,
  ModalBody,
  ModalContainer,
  ModalHeader,
  ModalSidebar,
  ModalSidebarHeader,
  ModalSidebarTitle,
  ScrollableModalContent,
  SidebarContent,
  StyledModal,
  useScrollDetection,
} from '@manuscripts/style-guide'
import { BibliographyItemAttrs } from '@manuscripts/transform'
import { isEqual } from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import {
  ReferenceForm,
  ReferenceFormActions,
} from './ReferenceForm/ReferenceForm'
import { ReferenceLine } from './ReferenceLine'

const ReferencesModalContainer = styled(ModalContainer)`
  min-width: 960px;
`

const ReferencesSidebar = styled(ModalSidebar)`
  width: 70%;
`

const ReferencesSidebarContent = styled(SidebarContent)`
  overflow-y: auto;
`

const ReferencesInnerWrapper = styled.div`
  width: 100%;
`

const ReferenceButton = styled.div`
  cursor: pointer;
  display: flex;
  justify-content: flex-start;
  padding: ${(props) => props.theme.grid.unit * 4}px 0;
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;

  path {
    fill: #c9c9c9;
  }

  :hover {
    background: ${(props) => props.theme.colors.background.info};
  }

  &.selected {
    background: ${(props) => props.theme.colors.background.info};
    border-top-color: #bce7f6;
    border-bottom-color: #bce7f6;
  }

  .tooltip {
    max-width: ${(props) => props.theme.grid.unit * 25}px;
    padding: ${(props) => props.theme.grid.unit * 2}px;
    border-radius: 6px;
  }
`

const IconContainer = styled.div`
  padding-right: ${(props) => props.theme.grid.unit * 5}px;
  position: relative;
`

const CitationCount = styled.div`
  border-radius: 50%;
  width: 12px;
  height: 12px;
  position: absolute;
  color: #ffffff;
  background-color: #bce7f6;
  text-align: center;
  vertical-align: top;
  top: 0;
  left: 16px;
  font-size: 9px;

  &.unused {
    background-color: #fe8f1f;
  }
`

const selectionTopOffset = 10 // to be able to place the selected item in the middle and allow for some scroll at the top
const pageSize = 12
const topTrigger = 0.2 // says: notify when x% of the offsetHeight remains hidden at the top
const bottomTrigger = 0.8 // says: notify when x% of the offsetHeight remains hidden at the bottom
const dropLimit = 36 // basically maximum amount of items that can exist at the same time

const normalize = (item: BibliographyItemAttrs) => ({
  id: item.id,
  type: item.type,
  author: item.author || [],
  editor: item.editor || [],
  issued: item.issued,
  ['container-title']: item['container-title'] || '',
  ['collection-title']: item['collection-title'] || '',
  DOI: item.DOI || '',
  URL: item.URL || '',
  volume: item.volume || '',
  issue: item.issue || '',
  supplement: item.supplement || '',
  edition: item.edition || '',
  page: item.page || '',
  ['number-of-pages']: item['number-of-pages'] || '',
  title: item.title || '',
  literal: item.literal || '',
  std: item.std || '',
  publisher: item.publisher || '',
  ['publisher-place']: item['publisher-place'] || '',
  event: item.event || '',
  ['event-place']: item['event-place'] || '',
  ['event-date']: item['event-date'],
  institution: item.institution || '',
  locator: item.locator || '',
  accessed: item.accessed,
  comment: item.comment || '',
})

export interface ReferencesModalProps {
  isOpen: boolean
  onCancel: () => void
  items: BibliographyItemAttrs[]
  item?: BibliographyItemAttrs
  citationCounts: Map<string, number>
  onSave: (item: BibliographyItemAttrs) => void
  onDelete: (item: BibliographyItemAttrs) => void
}

export const ReferencesModal: React.FC<ReferencesModalProps> = ({
  isOpen,
  onCancel,
  items,
  item,
  citationCounts,
  onSave,
  onDelete,
}) => {
  const [confirm, setConfirm] = useState(false)
  const valuesRef = useRef<BibliographyItemAttrs>(undefined)

  const [selection, setSelection] = useState<BibliographyItemAttrs>()
  const selectionRef = useRef<HTMLDivElement>(null)
  const isSelected = (item: BibliographyItemAttrs) => {
    return item.id === selection?.id
  }
  const selectionIndex = items.findIndex(isSelected)

  useEffect(() => {
    setSelection(item)
  }, [item])

  useEffect(() => {
    setTimeout(() => {
      selectionRef.current?.scrollIntoView({
        block: 'center',
        behavior: 'auto',
      })
    }, 100)
  }, [selectionIndex])

  const { ref, triggers } = useScrollDetection(topTrigger, bottomTrigger)

  const [startIndex, setStartIndex] = useState(
    Math.max(0, selectionIndex - selectionTopOffset)
  )
  const [endIndex, setEndIndex] = useState(pageSize)

  useEffect(() => {
    const base = Math.max(0, selectionIndex - selectionTopOffset)
    setStartIndex(base)
    setEndIndex(Math.min(items.length - 1, base + pageSize))
  }, [selectionIndex, items])

  useEffect(() => {
    if (triggers.top) {
      const newFirst = Math.max(0, startIndex - pageSize)
      setStartIndex(newFirst)
      setEndIndex(Math.min(newFirst + dropLimit, endIndex))
    }
    if (triggers.bottom) {
      const newLast = Math.min(items.length - 1, endIndex + pageSize)
      setEndIndex(newLast)
      setStartIndex(Math.max(newLast - dropLimit, startIndex))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggers, items])

  const actionsRef = useRef<ReferenceFormActions>(undefined)

  const reset = () => {
    actionsRef.current?.reset()
    setConfirm(false)
  }
  // Determine if the newly added citation is a new item by checking if it has properties beyond just 'id' and 'type'
  const isNewItem = (
    obj: BibliographyItemAttrs,
    basicProps: string | string[]
  ) => {
    const allKeys = Object.keys(obj)
    const extraKeys = allKeys.filter((key) => !basicProps.includes(key))
    return extraKeys.length > 0
  }

  const handleSave = (values: BibliographyItemAttrs | undefined) => {
    if (!values || !selection) {
      return
    }
    const item = {
      ...selection,
      ...values,
    }
    // Check if citation count for the new item is undefined, and set it to 1
    const currentCitationCount = citationCounts.get(item.id)

    if (currentCitationCount === undefined) {
      citationCounts.set(item.id, 1) // update the citation count in the Map
    }

    onSave(item)
    setSelection(item)
    setConfirm(false)
  }

  const handleDelete = () => {
    if (!selection) {
      return
    }
    onDelete(selection)
    setSelection(undefined)
  }

  const handleItemClick = (item: BibliographyItemAttrs) => {
    const values = valuesRef.current
    if (values && selection && !isEqual(values, normalize(selection))) {
      setConfirm(true)
      return
    }
    setSelection(item)
  }

  const handleChange = (values: BibliographyItemAttrs) => {
    valuesRef.current = values
  }
  if (items.length <= 0) {
    return <></>
  }

  return (
    <StyledModal isOpen={isOpen} onRequestClose={onCancel}>
      <Dialog
        isOpen={confirm}
        category={Category.confirmation}
        header="You've made changes to this option"
        message="Would you like to save or discard your changes?"
        actions={{
          secondary: {
            action: () => reset(),
            title: 'Discard',
          },
          primary: {
            action: () => handleSave(valuesRef.current),
            title: 'Save',
          },
        }}
      />
      <ReferencesModalContainer data-cy={'references-editor'}>
        <ModalHeader>
          <CloseButton onClick={onCancel} />
        </ModalHeader>
        <ModalBody>
          <ReferencesSidebar>
            <ModalSidebarHeader>
              <ModalSidebarTitle>References</ModalSidebarTitle>
            </ModalSidebarHeader>
            <ReferencesSidebarContent ref={ref}>
              <ReferencesInnerWrapper>
                {items.slice(startIndex, endIndex + 1).map((item) => (
                  <ReferenceButton
                    key={item.id}
                    id={item.id}
                    className={isSelected(item) ? 'selected' : ''}
                    onClick={() => handleItemClick(item)}
                    ref={isSelected(item) ? selectionRef : null}
                  >
                    <IconContainer>
                      <CitationCountIcon />
                      {(citationCounts.get(item.id) || 0) > 0 ? (
                        <CitationCount data-tooltip-content="Number of times used in the document">
                          {citationCounts.get(item.id)}
                        </CitationCount>
                      ) : (
                        <CitationCount className="unused">0</CitationCount>
                      )}
                    </IconContainer>
                    <ReferenceLine item={item} />
                  </ReferenceButton>
                ))}
              </ReferencesInnerWrapper>
            </ReferencesSidebarContent>
          </ReferencesSidebar>
          <ScrollableModalContent>
            {selection && (
              <ReferenceForm
                values={normalize(selection)}
                showDelete={
                  !citationCounts.get(selection.id) &&
                  isNewItem(selection, ['id', 'type']) // disable the delete button for the new citations
                }
                onChange={handleChange}
                onCancel={onCancel}
                onDelete={handleDelete}
                onSave={handleSave}
                actionsRef={actionsRef}
              />
            )}
          </ScrollableModalContent>
        </ModalBody>
      </ReferencesModalContainer>
    </StyledModal>
  )
}
