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
import {
  AddIcon,
  AffiliationPlaceholderIcon,
  CloseButton,
  InspectorTabPanel,
  InspectorTabPanels,
  InspectorTabs,
  outlineStyle,
  ModalBody,
  ModalContainer,
  ModalHeader,
  ModalSidebar,
  ModalSidebarHeader,
  ModalSidebarTitle,
  ScrollableModalContent,
  SidebarContent,
  StyledModal,
} from '@manuscripts/style-guide'
import { generateNodeID, schema } from '@manuscripts/transform'
import { isEqual } from 'lodash'
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import styled from 'styled-components'

import {
  AffiliationAttrs,
  authorComparator,
  ContributorAttrs,
} from '../../lib/authors'
import { checkID } from '../../lib/normalize'
import { authorsReducer } from '../authors/AuthorsModal'
import { affiliationsReducer } from '../authors/useManageAffiliations'
import { ConfirmationDialog, DialogType } from '../dialog/ConfirmationDialog'
import FormFooter from '../form/FormFooter'
import { FormPlaceholder } from '../form/FormPlaceholder'
import { ModalFormActions, ModalFormSaveButton } from '../form/ModalFormActions'
import { ModalTabs } from '../authors-affiliations/ModalTabs'
import { AuthorsPanel } from '../authors/AuthorsPanel'
import { AffiliationForm, FormActions } from './AffiliationForm'
import { AffiliationList } from './AffiliationList'

export interface AffiliationsModalProps {
  affiliation?: AffiliationAttrs
  authors: ContributorAttrs[]
  affiliations: AffiliationAttrs[]
  onSaveAffiliation: (affiliation: AffiliationAttrs) => void
  onDeleteAffiliation: (affiliation: AffiliationAttrs) => void
  onUpdateAuthors: (authors: ContributorAttrs[]) => void
  addNewAffiliation?: boolean
  onClose?: () => void
  openAuthorsModal?: () => void
}

const MODAL_ON_CLOSE_NOTIFY_DELAY_MS = 220

function makeAuthorItems(authors: ContributorAttrs[]) {
  return authors.map((author) => ({
    id: author.id,
    label: `${author.given} ${author.family}`,
  }))
}

export const AffiliationsModal: React.FC<AffiliationsModalProps> = ({
  authors: $authors,
  affiliations: $affiliations,
  affiliation,
  onSaveAffiliation,
  onDeleteAffiliation,
  onUpdateAuthors,
  addNewAffiliation = false,
  onClose,
  openAuthorsModal,
}) => {
  const [isOpen, setIsOpen] = useState(true)
  const [selection, setSelection] = useState(affiliation)
  const [showingDeleteDialog, setShowDeleteDialog] = useState(false)
  const valuesRef = useRef<AffiliationAttrs>(undefined)
  const actionsRef = useRef<FormActions>(undefined)
  const [authors, dispatchAuthors] = useReducer(
    authorsReducer,
    $authors.sort(authorComparator)
  )
  useEffect(() => {
    dispatchAuthors({
      type: 'set',
      state: [...$authors].sort(authorComparator),
    })
  }, [$authors])
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
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([])
  const [pendingSelection, setPendingSelection] =
    useState<AffiliationAttrs | null>(null)
  const [pendingAction, setPendingAction] = useState<
    'select' | 'new' | 'close' | null
  >(null)
  const [savedAffiliationId, setSavedAffiliationId] = useState<
    string | undefined
  >(undefined)
  const [affiliationAuthorMap, setAffiliationAuthorMap] = useState<
    Map<string, string[]>
  >(new Map())
  const [affiliationTabHasError, setAffiliationTabHasError] = useState(false)
  const [
    affiliationDetailsUnsavedContinue,
    setAffiliationDetailsUnsavedContinue,
  ] = useState(false)
  const [affiliationTabIndex, setAffiliationTabIndex] = useState(0)

  const prevIsOpenRef = useRef(true)
  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) {
      prevIsOpenRef.current = isOpen
      const id = window.setTimeout(() => {
        onClose?.()
      }, MODAL_ON_CLOSE_NOTIFY_DELAY_MS)
      return () => window.clearTimeout(id)
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, onClose])

  useEffect(() => {
    if (isDisableSave) {
      setAffiliationDetailsUnsavedContinue(false)
    }
  }, [isDisableSave])

  useEffect(() => {
    setAffiliationDetailsUnsavedContinue(false)
  }, [selection?.id])

  useEffect(() => {
    if (selection?.id) {
      setAffiliationTabIndex(0)
    }
  }, [selection?.id])

  useEffect(() => {
    if (!selection) {
      return
    }
    const currentAffiliation = selection
    const affiliatedAuthorIds = authors
      .filter((author) =>
        author.affiliationIDs?.includes(currentAffiliation.id)
      )
      .map((author) => author.id)
    setSelectedAuthorIds(affiliatedAuthorIds)
    setAffiliationAuthorMap((prevMap) => {
      const newMap = new Map(prevMap)
      newMap.set(currentAffiliation.id, affiliatedAuthorIds)
      return newMap
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClose = () => {
    const values = valuesRef.current
    const hasAffiliationChanges =
      selection && !isEqual(values, checkID(selection, 'affiliation'))
    const originalAuthors = selection
      ? (affiliationAuthorMap.get(selection.id) ?? [])
      : []
    const hasAuthorChanges = !isEqual(
      originalAuthors.sort(),
      selectedAuthorIds.sort()
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
      setSelection(undefined)
    }
  }

  const handleSelect = (affiliation: AffiliationAttrs) => {
    const values = valuesRef.current
    const hasAffiliationChanges =
      selection && !isEqual(values, checkID(selection, 'affiliation'))
    const originalAuthors = selection
      ? (affiliationAuthorMap.get(selection.id) ?? [])
      : []
    const hasAuthorChanges = !isEqual(
      originalAuthors.sort(),
      selectedAuthorIds.sort()
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
        .filter((author) => author.affiliationIDs?.includes(affiliation.id))
        .map((author) => author.id)
      setNewAffiliation(false)
      setSelection(affiliation)
      setSelectedAuthorIds(affiliatedAuthorIds)
      setAffiliationAuthorMap((prevMap) => {
        const newMap = new Map(prevMap)
        newMap.set(affiliation.id, affiliatedAuthorIds)
        return newMap
      })
    }
  }

  const handleSaveAffiliation = useCallback(
    (values: AffiliationAttrs | undefined) => {
      if (!values || !selection) {
        return
      }
      setIsDisableSave(true)
      const affiliation = {
        ...checkID(selection, 'affiliation'),
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
        affiliationIDs: selectedAuthorIds.includes(author.id)
          ? [...new Set([...(author.affiliationIDs || []), affiliation.id])]
          : (author.affiliationIDs || []).filter((id) => id !== affiliation.id),
      }))

      dispatchAuthors({
        type: 'update',
        items: updatedAuthors,
      })

      onUpdateAuthors(updatedAuthors)
      setNewAffiliation(false)
      setAffiliationAuthorMap((prevMap) => {
        const newMap = new Map(prevMap)
        newMap.set(affiliation.id, selectedAuthorIds)
        return newMap
      })
      setAffiliationDetailsUnsavedContinue(false)

      setSavedAffiliationId(affiliation.id)

      setTimeout(() => {
        setSavedAffiliationId(undefined)
      }, 3200)
    },
    [
      authors,
      dispatchAffiliations,
      dispatchAuthors,
      onSaveAffiliation,
      onUpdateAuthors,
      selectedAuthorIds,
      selection,
    ]
  )

  const handleAffiliationChange = (values: AffiliationAttrs) => {
    valuesRef.current = values
    if (!selection || selection.id !== values.id) {
      setIsDisableSave(true)
      return
    }
    const isInstitutionEmpty = !values.institution?.trim()
    const hasAffiliationChanges =
      selection &&
      !isEqual(
        checkID(values, 'affiliation'),
        checkID(selection, 'affiliation')
      )
    const originalAuthors = affiliationAuthorMap.get(selection.id) ?? []
    const hasAuthorChanges =
      selection && !isEqual(originalAuthors.sort(), selectedAuthorIds.sort())
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
      affiliationIDs: (author.affiliationIDs || []).filter(
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
    setSelectedAuthorIds([])
    setSelection(undefined)
  }

  const selectAuthor = (authorId: string) => {
    if (!selection) {
      return
    }

    const newSelectedAuthorIds = selectedAuthorIds.includes(authorId)
      ? selectedAuthorIds.filter((id) => id !== authorId)
      : [...selectedAuthorIds, authorId]
    setSelectedAuthorIds(newSelectedAuthorIds)

    const hasAffiliationChanges = !isEqual(
      valuesRef.current,
      checkID(selection, 'affiliation')
    )
    const originalAuthors = affiliationAuthorMap.get(selection.id) ?? []
    const hasAuthorChanges = !isEqual(
      originalAuthors.sort(),
      newSelectedAuthorIds.sort()
    )

    const isInstitutionEmpty = !valuesRef.current?.institution?.trim()
    const shouldEnableSave =
      !isInstitutionEmpty && (hasAffiliationChanges || hasAuthorChanges)
    setIsDisableSave(!shouldEnableSave)
  }

  const selectedAuthors = selectedAuthorIds
    .map((authorId) => {
      const author = authors.find((a) => a.id === authorId)
      return {
        id: authorId,
        label: author ? `${author.given} ${author.family}` : '',
      }
    })
    .filter((author) => author.label)

  const handleAddAffiliation = () => {
    const values = valuesRef.current
    const hasChanges = !isDisableSave
    const isInstitutionEmpty = values?.institution?.trim() === ''
    const emptyAffiliation = createEmptyAffiliation(affiliations.length)

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
    setSelection(emptyAffiliation)
    setSelectedAuthorIds([])
  }

  useEffect(() => {
    if (addNewAffiliation) {
      handleAddAffiliation()
      setNewAffiliation(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addNewAffiliation])

  const handleConfirmationCancel = () => {
    const action = pendingAction
    const pending = pendingSelection

    setShowConfirmationDialog(false)
    setShowRequiredFieldConfirmationDialog(false)

    if (action === 'close') {
      setIsOpen(false)
      setSelection(undefined)
      valuesRef.current = undefined
      setPendingSelection(null)
      setPendingAction(null)
      return
    }

    if (action === 'select' && pending) {
      setSelection(pending)
      setNewAffiliation(false)
      const affiliatedAuthorIds = authors
        .filter((author) =>
          author.affiliationIDs?.some((aff) => aff === pending.id)
        )
        .map((author) => author.id)
      setSelectedAuthorIds(affiliatedAuthorIds)
      valuesRef.current = checkID(pending, 'affiliation')
      setAffiliationAuthorMap((prevMap) => {
        const newMap = new Map(prevMap)
        newMap.set(pending.id, affiliatedAuthorIds)
        return newMap
      })
    } else if (action === 'new') {
      setNewAffiliation(true)
      setSelection(affiliation)
      setSelectedAuthorIds([])
      valuesRef.current = affiliation
        ? checkID(affiliation, 'affiliation')
        : undefined
    } else if (pending) {
      valuesRef.current = checkID(pending, 'affiliation')
    } else {
      valuesRef.current = undefined
    }

    setPendingSelection(null)
    setPendingAction(null)
  }

  return (
    <StyledModal
      isOpen={isOpen}
      onRequestClose={() => handleClose()}
      shouldCloseOnOverlayClick={true}
    >
      <ModalContainer data-cy="affiliations-modal">
        <ModalHeader>
          <CloseButton
            onClick={() => handleClose()}
            data-cy="modal-close-button"
          />
        </ModalHeader>

        <StyledModalBody>
          <ModalSidebar>
            <StyledModalSidebarHeader>
              <ModalSidebarTitle>Institutional Affiliations</ModalSidebarTitle>
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
          <StyledScrollableModalContent data-cy="affiliations-modal-content">
            {selection ? (
              <>
                <AffiliationTabs
                  selectedIndex={affiliationTabIndex}
                  onChange={setAffiliationTabIndex}
                >
                  <ModalFormActions
                    type="affiliation"
                    onDelete={handleDeleteAffiliation}
                    showingDeleteDialog={
                      showingDeleteDialog &&
                      !(
                        showConfirmationDialog ||
                        showRequiredFieldConfirmationDialog
                      )
                    }
                    showDeleteDialog={handleShowDeleteDialog}
                  />
                  <ModalTabs
                    tabLabels={['Affiliation Details', 'Authors']}
                    tabErrorIndicators={[affiliationTabHasError, false]}
                    tabWarningIndicators={[
                      affiliationDetailsUnsavedContinue &&
                        !affiliationTabHasError,
                      false,
                    ]}
                  />
                  <InspectorTabPanels>
                    <AffiliationTabPanel>
                      <AffiliationForm
                        values={checkID(selection, 'affiliation')}
                        onSave={(attrs) => handleSaveAffiliation(attrs)}
                        onChange={handleAffiliationChange}
                        actionsRef={actionsRef}
                        newEntity={newAffiliation}
                        onAffiliationErrorChange={setAffiliationTabHasError}
                        unsavedContinueActive={
                          affiliationDetailsUnsavedContinue
                        }
                      />
                    </AffiliationTabPanel>
                    {openAuthorsModal && (
                      <AffiliationTabPanel>
                        <AuthorsPanel
                          items={makeAuthorItems(authors)}
                          selectedItems={selectedAuthors}
                          onSelect={selectAuthor}
                          openAuthorsModal={openAuthorsModal}
                        />
                      </AffiliationTabPanel>
                    )}
                  </InspectorTabPanels>
                </AffiliationTabs>
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
                  onPrimary={() => {
                    setShowConfirmationDialog(false)
                    setPendingSelection(null)
                    setPendingAction(null)
                    setAffiliationDetailsUnsavedContinue(true)
                  }}
                  onSecondary={handleConfirmationCancel}
                  type={DialogType.SAVE}
                  entityType="affiliation"
                />
              </>
            ) : (
              <FormPlaceholder
                type="affiliation"
                title="Affiliation Details"
                message="Select an affiliation from the list to display it's details here."
                placeholderIcon={<AffiliationPlaceholderIcon />}
              />
            )}
          </StyledScrollableModalContent>
        </StyledModalBody>
        <FormFooter
          onCancel={handleClose}
          primaryAction={
            selection ? (
              <ModalFormSaveButton
                form="affiliation-form"
                newEntity={newAffiliation}
                isDisableSave={isDisableSave}
                onSubmitForm={() => actionsRef.current?.submitForm?.()}
              />
            ) : undefined
          }
        />
      </ModalContainer>
    </StyledModal>
  )
}

function createEmptyAffiliation(priority: number): AffiliationAttrs {
  return {
    id: generateNodeID(schema.nodes.affiliation),
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
    priority: priority,
  }
}

const StyledSidebarContent = styled(SidebarContent)`
  padding: 8px;
`
const AddAffiliationButton = styled.button`
  background: none;
  border: none;
  margin: 0;
  font: inherit;
  color: inherit;
  width: 100%;
  display: flex;
  align-items: center;
  padding: 12px 8px 12px 12px;
  cursor: pointer;
  &[data-active='true'] {
    background: ${(props) => props.theme.colors.background.fifth};
    border: 1px solid ${(props) => props.theme.colors.border.primary};
    border-left: 0;
    border-right: 0;
  }
  ${outlineStyle}
`

const ActionTitle = styled.div`
  padding-left: ${(props) => props.theme.grid.unit * 2}px;
`

const AffiliationTabs = styled(InspectorTabs)`
  position: relative;
`
const AffiliationTabPanel = styled(InspectorTabPanel).attrs({
  tabIndex: -1,
  unmount: false,
})`
  margin-top: ${(props) => props.theme.grid.unit * 4}px;
  height: calc(100% - 16px);
`

const StyledModalBody = styled(ModalBody)`
  position: relative;
  height: calc(90vh - 40px);
`
const StyledModalSidebarHeader = styled(ModalSidebarHeader)`
  margin-top: 8px;
  margin-bottom: 16px;
`

const StyledScrollableModalContent = styled(ScrollableModalContent)`
  padding: 45px 16px 16px;
`
