/*!
 * © 2025 Atypon Systems LLC
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
import { generateID, ObjectTypes } from '@manuscripts/json-schema'
import {
  AddIcon,
  AddUserIcon,
  AffiliationPlaceholderIcon,
  CloseButton,
  Drawer,
  ModalBody,
  ModalContainer,
  ModalHeader,
  ModalSidebar,
  ModalSidebarHeader,
  ModalSidebarTitle,
  ScrollableModalContent,
  SelectedItemsBox,
  SidebarContent,
  StyledModal,
} from '@manuscripts/style-guide'
import { isEqual } from 'lodash'
import React, { useEffect, useReducer, useRef, useState } from 'react'
import styled from 'styled-components'

import {
  AffiliationAttrs,
  authorComparator,
  ContributorAttrs,
} from '../../lib/authors'
import { affiliationsReducer, authorsReducer } from '../authors/AuthorsModal'
import { ConfirmationDialog, DialogType } from '../dialog/ConfirmationDialog'
import FormFooter from '../form/FormFooter'
import { FormPlaceholder } from '../form/FormPlaceholder'
import { ModalFormActions } from '../form/ModalFormActions'
import { AffiliationForm, FormActions } from './AffiliationForm'
import { AffiliationList } from './AffiliationList'
const StyledSidebarContent = styled(SidebarContent)`
  padding: 0;
`
const AddAffiliationButton = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 8px 12px 16px;
  cursor: pointer;
  &[data-active='true'] {
    background: ${(props) => props.theme.colors.background.fifth};
    border: 1px solid ${(props) => props.theme.colors.border.primary};
    border-left: 0;
    border-right: 0;
  }
`

const ActionTitle = styled.div`
  padding-left: ${(props) => props.theme.grid.unit * 2}px;
`
const AffiliationForms = styled.div`
  padding-left: ${(props) => props.theme.grid.unit * 3}px;
  padding-right: ${(props) => props.theme.grid.unit * 3}px;
  height: 100%;
  position: relative;
  margin-top: 20px;
`

const AuthorsSection = styled.div`
  margin-top: ${(props) => props.theme.grid.unit * 4}px;
  padding-top: ${(props) => props.theme.grid.unit * 4}px;
  border-top: 1px solid ${(props) => props.theme.colors.border.tertiary};
`

const AuthorsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;
  margin-bottom: ${(props) => props.theme.grid.unit * 2}px;
`

const AuthorsTitle = styled.h3`
  margin: 0;
  font-weight: ${(props) => props.theme.font.weight.normal};
  font-size: ${(props) => props.theme.font.size.large};
  font-family: ${(props) => props.theme.font.family.sans};
  color: ${(props) => props.theme.colors.text.secondary};
`

const AffiliateButton = styled.button`
  color: ${(props) => props.theme.colors.brand.default};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font: ${(props) => props.theme.font.weight.normal}
    ${(props) => props.theme.font.size.normal}
    ${(props) => props.theme.font.family.sans};
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: ${(props) => props.theme.grid.unit * 2}px;
  &:hover {
    opacity: 0.8;
  }
`
const StyledModalBody = styled(ModalBody)`
  position: relative;
  height: calc(90vh - 40px);
`
const StyledModalSidebarHeader = styled(ModalSidebarHeader)`
  margin-top: 8px;
  margin-bottom: 16px;
`

const normalize = (affiliation: AffiliationAttrs) => ({
  id: affiliation.id,
  institution: affiliation.institution,
  department: affiliation.department,
  addressLine1: affiliation.addressLine1,
  addressLine2: affiliation.addressLine2,
  addressLine3: affiliation.addressLine3,
  postCode: affiliation.postCode,
  country: affiliation.country,
  county: affiliation.county,
  city: affiliation.city,
  email: affiliation.email,
  priority: affiliation.priority,
})

export interface AffiliationsModalProps {
  authors: ContributorAttrs[]
  affiliations: AffiliationAttrs[]
  onSaveAffiliation: (affiliation: AffiliationAttrs) => void
  onDeleteAffiliation: (affiliation: AffiliationAttrs) => void
  onUpdateAuthors: (authors: ContributorAttrs[]) => void
  addNewAffiliation?: boolean
}

export const AffiliationsModal: React.FC<AffiliationsModalProps> = ({
  authors: $authors,
  affiliations: $affiliations,
  onSaveAffiliation,
  onDeleteAffiliation,
  onUpdateAuthors,
  addNewAffiliation = false,
}) => {
  const [isOpen, setIsOpen] = useState(true)
  const [selection, setSelection] = useState<AffiliationAttrs | undefined>(
    undefined
  )
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const valuesRef = useRef<AffiliationAttrs>()
  const actionsRef = useRef<FormActions>()
  const [authors, dispatchAuthors] = useReducer(
    authorsReducer,
    $authors.sort(authorComparator)
  )
  const [affiliations, dispatchAffiliations] = useReducer(
    affiliationsReducer,
    $affiliations
  )
  const [isDisableSave, setIsDisableSave] = useState(true)
  const [newAffiliation, setNewAffiliation] = useState(false)
  const [
    showRequiredFieldConfirmationDialog,
    setShowRequiredFieldConfirmationDialog,
  ] = useState(false)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const affiliation: AffiliationAttrs = {
    id: generateID(ObjectTypes.Affiliation),
    institution: '',
    department: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    postCode: '',
    country: '',
    county: '',
    city: '',
    email: {
      href: '',
      text: '',
    },
    priority: affiliations.length,
  }
  const [showAuthorDrawer, setShowAuthorDrawer] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingSelection, setPendingSelection] =
    useState<AffiliationAttrs | null>(null)
  const [pendingAction, setPendingAction] = useState<
    'select' | 'new' | 'close' | null
  >(null)
  const [savedAffiliationId, setSavedAffiliationId] = useState<
    string | undefined
  >(undefined)
  const [affiliationAuthorMap, setAffiliationAuthorMap] = useState<
    Record<string, string[]>
  >({})
  const handleClose = () => {
    const values = valuesRef.current
    const hasAffiliationChanges =
      selection && !isEqual(values, normalize(selection))
    const originalAuthors = affiliationAuthorMap[selection?.id || ''] || []
    const hasAuthorChanges = !isEqual(
      originalAuthors.sort(),
      selectedIds.sort()
    )
    const hasChanges = hasAffiliationChanges || (selection && hasAuthorChanges)
    const isInstitutionEmpty = values?.institution?.trim() === ''
    if (hasChanges) {
      if (isInstitutionEmpty && hasAffiliationChanges) {
        setShowRequiredFieldConfirmationDialog(true)
      } else {
        setShowConfirmationDialog(true)
      }
      setPendingAction('close')
    } else {
      setIsOpen(false)
    }
  }

  const handleSelect = (affiliation: AffiliationAttrs) => {
    const values = valuesRef.current
    const hasAffiliationChanges =
      selection && !isEqual(values, normalize(selection))
    const originalAuthors = affiliationAuthorMap[selection?.id || ''] || []
    const hasAuthorChanges = !isEqual(
      originalAuthors.sort(),
      selectedIds.sort()
    )
    const hasChanges = hasAffiliationChanges || hasAuthorChanges
    const isInstitutionEmpty = values?.institution?.trim() === ''
    if (hasChanges) {
      setPendingSelection(affiliation)
      setPendingAction('select')
      if (isInstitutionEmpty && hasAffiliationChanges) {
        setShowRequiredFieldConfirmationDialog(true)
      } else {
        setShowConfirmationDialog(true)
      }
    } else {
      const affiliatedAuthorIds = authors
        .filter((author) => author.affiliations?.includes(affiliation.id))
        .map((author) => author.id)
      setNewAffiliation(false)
      setSelection(affiliation)
      setSelectedIds(affiliatedAuthorIds)
      setAffiliationAuthorMap((prevMap) => ({
        ...prevMap,
        [affiliation.id]: affiliatedAuthorIds,
      }))
    }
  }

  const handleSaveAffiliation = (values: AffiliationAttrs | undefined) => {
    if (!values || !selection) {
      return
    }
    setIsDisableSave(true)
    const affiliation = {
      ...normalize(selection),
      ...values,
    }
    onSaveAffiliation(affiliation)
    dispatchAffiliations({
      type: 'update',
      items: [affiliation],
    })
    setSelection(affiliation)
    const updatedAuthors = authors.map((author) => ({
      ...author,
      affiliations: selectedIds.includes(author.id)
        ? [...new Set([...(author.affiliations || []), affiliation.id])]
        : (author.affiliations || []).filter((id) => id !== affiliation.id),
    }))

    dispatchAuthors({
      type: 'update',
      items: updatedAuthors,
    })
    onUpdateAuthors(updatedAuthors)

    setNewAffiliation(false)
    setAffiliationAuthorMap((prevMap) => ({
      ...prevMap,
      [affiliation.id]: selectedIds,
    }))

    setSavedAffiliationId(affiliation.id)
    setTimeout(() => {
      setSavedAffiliationId(undefined)
    }, 3200)
  }

  const handleAffiliationChange = (values: AffiliationAttrs) => {
    valuesRef.current = values
    if (!selection || selection.id !== values.id) {
      setIsDisableSave(true)
      return
    }
    const isInstitutionEmpty = !values.institution?.trim()
    const hasAffiliationChanges =
      selection && !isEqual(normalize(values), normalize(selection))
    const originalAuthors = affiliationAuthorMap[selection?.id || ''] || []
    const hasAuthorChanges =
      selection && !isEqual(originalAuthors.sort(), selectedIds.sort())
    const shouldEnableSave =
      !isInstitutionEmpty && (hasAffiliationChanges || hasAuthorChanges)
    setIsDisableSave(!shouldEnableSave)
  }

  const handleShowDeleteDialog = () => {
    setShowDeleteDialog((prev) => !prev)
  }

  const handleDeleteAffiliation = () => {
    if (!selection) {
      return
    }

    const updatedAuthors = authors.map((author) => ({
      ...author,
      affiliations: (author.affiliations || []).filter(
        (id) => id !== selection.id
      ),
    }))

    dispatchAuthors({
      type: 'update',
      items: updatedAuthors,
    })
    onUpdateAuthors(updatedAuthors)

    onDeleteAffiliation(selection)
    dispatchAffiliations({
      type: 'delete',
      item: selection,
    })
    setSelectedIds([])
    setSelection(undefined)
  }

  const handleAuthorSelect = (authorId: string) => {
    if (!selection) {
      return
    }

    const newSelectedAuthorIds = selectedIds.includes(authorId)
      ? selectedIds.filter((id) => id !== authorId)
      : [...selectedIds, authorId]
    setSelectedIds(newSelectedAuthorIds)

    const hasAffiliationChanges = !isEqual(
      valuesRef.current,
      normalize(selection)
    )
    const originalAuthors = affiliationAuthorMap[selection.id] || []
    const hasAuthorChanges = !isEqual(
      originalAuthors.sort(),
      newSelectedAuthorIds.sort()
    )

    const isInstitutionEmpty = !valuesRef.current?.institution?.trim()
    const shouldEnableSave =
      !isInstitutionEmpty && (hasAffiliationChanges || hasAuthorChanges)
    setIsDisableSave(!shouldEnableSave)
  }

  const authorItems = authors.map((author) => ({
    id: author.id,
    label: `${author.bibliographicName.given} ${author.bibliographicName.family}`,
  }))

  const selectedAuthors = selectedIds
    .map((authorId) => {
      const author = authors.find((a) => a.id === authorId)
      return {
        id: authorId,
        label: author
          ? `${author.bibliographicName.given} ${author.bibliographicName.family}`
          : '',
      }
    })
    .filter((author) => author.label)

  const handleAddAffiliation = () => {
    const values = valuesRef.current
    const hasChanges = !isDisableSave
    const isInstitutionEmpty = values?.institution?.trim() === ''

    if (hasChanges) {
      setPendingAction('new')
      if (isInstitutionEmpty) {
        setShowRequiredFieldConfirmationDialog(true)
      } else {
        setShowConfirmationDialog(true)
      }
      return
    }

    setNewAffiliation(true)
    setSelection(affiliation)
    setSelectedIds([])
  }

  useEffect(() => {
    if (addNewAffiliation) {
      handleAddAffiliation()
      setNewAffiliation(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addNewAffiliation])

  const handleConfirmationSave = () => {
    handleSaveAffiliation(valuesRef.current)
    setShowConfirmationDialog(false)
    setShowRequiredFieldConfirmationDialog(false)

    if (pendingAction === 'new') {
      setNewAffiliation(true)
      setSelection(affiliation)
      setSelectedIds([])
      setIsDisableSave(true)
    } else if (pendingAction === 'select' && pendingSelection) {
      setSelection(pendingSelection)
      setNewAffiliation(false)
      const affiliatedAuthorIds = authors
        .filter((author) =>
          author.affiliations?.some((aff) => aff === pendingSelection.id)
        )
        .map((author) => author.id)
      setSelectedIds(affiliatedAuthorIds)
      // Reset values and save button state for the new selection
      valuesRef.current = normalize(pendingSelection)
      setIsDisableSave(true)

      // Update affiliation author map for the new selection
      setAffiliationAuthorMap((prevMap) => ({
        ...prevMap,
        [pendingSelection.id]: affiliatedAuthorIds,
      }))
    }

    setPendingSelection(null)
    setPendingAction(null)

    if (pendingAction === 'close') {
      setIsOpen(false)
    }
  }

  const handleConfirmationCancel = () => {
    setShowConfirmationDialog(false)
    setShowRequiredFieldConfirmationDialog(false)

    if (pendingAction === 'select' && pendingSelection) {
      setSelection(pendingSelection)
      setNewAffiliation(false)
      const affiliatedAuthorIds = authors
        .filter((author) =>
          author.affiliations?.some((aff) => aff === pendingSelection.id)
        )
        .map((author) => author.id)
      setSelectedIds(affiliatedAuthorIds)
    } else if (pendingAction === 'new') {
      setNewAffiliation(true)
      setSelection(affiliation)
      setSelectedIds([])
    }

    if (pendingSelection) {
      valuesRef.current = normalize(pendingSelection)
    } else {
      valuesRef.current = undefined
    }

    setPendingSelection(null)
    setPendingAction(null)

    if (pendingAction === 'close') {
      setIsOpen(false)
    }
  }

  return (
    <StyledModal
      isOpen={isOpen}
      onRequestClose={() => handleClose()}
      shouldCloseOnOverlayClick={true}
    >
      <ModalContainer>
        <ModalHeader>
          <CloseButton
            onClick={() => handleClose()}
            data-cy="modal-close-button"
          />
        </ModalHeader>

        <StyledModalBody>
          <ModalSidebar>
            <StyledModalSidebarHeader>
              <ModalSidebarTitle>Affiliations</ModalSidebarTitle>
            </StyledModalSidebarHeader>
            <StyledSidebarContent>
              <AddAffiliationButton
                data-cy="add-affiliation-button"
                onClick={handleAddAffiliation}
                data-active={newAffiliation}
              >
                <AddIcon width={18} height={18} />
                <ActionTitle>New Affiliation</ActionTitle>
              </AddAffiliationButton>
              <AffiliationList
                affiliation={selection}
                affiliations={affiliations}
                onSelect={handleSelect}
                onDelete={handleShowDeleteDialog}
                lastSavedAffiliationId={savedAffiliationId}
              />
            </StyledSidebarContent>
          </ModalSidebar>
          <ScrollableModalContent data-cy="affiliations-modal-content">
            <AffiliationForms>
              {selection ? (
                <>
                  <ModalFormActions
                    type={'affiliation'}
                    onSave={() => handleSaveAffiliation(valuesRef.current)}
                    onDelete={handleDeleteAffiliation}
                    showDeleteDialog={showDeleteDialog}
                    handleShowDeleteDialog={handleShowDeleteDialog}
                    newEntity={newAffiliation}
                    isDisableSave={isDisableSave}
                  />
                  <AffiliationForm
                    values={normalize(selection)}
                    onSave={handleSaveAffiliation}
                    onChange={handleAffiliationChange}
                    actionsRef={actionsRef}
                  ></AffiliationForm>
                  <ConfirmationDialog
                    isOpen={showRequiredFieldConfirmationDialog}
                    onPrimary={() =>
                      setShowRequiredFieldConfirmationDialog(false)
                    }
                    onSecondary={handleConfirmationCancel}
                    type={DialogType.REQUIRED}
                    entityType="affiliation"
                  />
                  <ConfirmationDialog
                    isOpen={showConfirmationDialog}
                    onPrimary={handleConfirmationSave}
                    onSecondary={handleConfirmationCancel}
                    type={DialogType.SAVE}
                    entityType="affiliation"
                  />
                  <AuthorsSection>
                    <AuthorsHeader>
                      <AuthorsTitle>Authors</AuthorsTitle>
                      <AffiliateButton
                        onClick={() => setShowAuthorDrawer(true)}
                        data-cy="affiliate-authors-button"
                      >
                        <AddUserIcon width={16} height={16} />
                        Affiliate Authors
                      </AffiliateButton>
                    </AuthorsHeader>
                    <SelectedItemsBox
                      items={selectedAuthors}
                      onRemove={(id) => {
                        setSelectedIds((prev) =>
                          prev.filter((authorId) => authorId !== id)
                        )
                      }}
                      placeholder="No authors assigned"
                    />
                  </AuthorsSection>
                </>
              ) : (
                <FormPlaceholder
                  type="affiliation"
                  title={'Affiliation Details'}
                  message={
                    "Select an affiliation from the list to display it's details here."
                  }
                  placeholderIcon={<AffiliationPlaceholderIcon />}
                />
              )}
              {showAuthorDrawer && (
                <Drawer
                  items={authorItems}
                  selectedIds={selectedIds}
                  title="Authors"
                  onSelect={handleAuthorSelect}
                  onBack={() => setShowAuthorDrawer(false)}
                  width="100%"
                />
              )}
            </AffiliationForms>
          </ScrollableModalContent>
        </StyledModalBody>
        <FormFooter onCancel={handleClose} />
      </ModalContainer>
    </StyledModal>
  )
}
