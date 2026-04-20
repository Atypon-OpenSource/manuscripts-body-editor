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
  AuthorPlaceholderIcon,
  CloseButton,
  FormSubtitle,
  ModalBody,
  ModalContainer,
  ModalHeader,
  ModalSidebar,
  ModalSidebarHeader,
  ModalSidebarTitle,
  outlineStyle,
  ScrollableModalContent,
  SidebarContent,
  StyledModal,
  InspectorTabs,
  InspectorTabPanel,
  InspectorTabPanels,
} from '@manuscripts/style-guide'
import { generateNodeID, schema } from '@manuscripts/transform'
import { cloneDeep, isEqual, omit } from 'lodash'
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import styled from 'styled-components'

import { arrayReducer } from '../../lib/array-reducer'
import {
  AffiliationAttrs,
  authorComparator,
  ContributorAttrs,
} from '../../lib/authors'
import { normalizeAuthor } from '../../lib/normalize'
import { ConfirmationDialog, DialogType } from '../dialog/ConfirmationDialog'
import FormFooter from '../form/FormFooter'
import { FormPlaceholder } from '../form/FormPlaceholder'
import { ModalFormActions, ModalFormSaveButton } from '../form/ModalFormActions'
import { ModalTabs } from '../authors-affiliations/ModalTabs'
import { AffiliationsPanel } from '../affiliations/AffiliationsPanel'
import { AuthorDetailsForm, FormActions } from './AuthorDetailsForm'
import { AuthorList } from './AuthorList'
import { CreditContributionsCheckboxes } from './CreditDrawer'
import { useManageAffiliations } from './useManageAffiliations'
import { useManageCredit } from './useManageCredit'

const MODAL_ON_CLOSE_NOTIFY_DELAY_MS = 220

export const authorsReducer = arrayReducer<ContributorAttrs>(
  (a, b) => a.id === b.id
)

export interface AuthorsModalProps {
  author?: ContributorAttrs
  authors: ContributorAttrs[]
  affiliations: AffiliationAttrs[]
  onSaveAuthor: (author: ContributorAttrs) => void
  onDeleteAuthor: (author: ContributorAttrs) => void
  addNewAuthor?: boolean
  isOverlay?: boolean
  onOpenAffiliationsModal?: () => void
  onClose?: () => void
}

export const AuthorsModal: React.FC<AuthorsModalProps> = ({
  authors: $authors,
  affiliations: $affiliations,
  author,
  onSaveAuthor,
  onDeleteAuthor,
  addNewAuthor = false,
  isOverlay = false,
  onOpenAffiliationsModal,
  onClose,
}) => {
  const [isOpen, setOpen] = useState(true)
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
  const [isDisableSave, setDisableSave] = useState(true)
  const [isEmailRequired, setEmailRequired] = useState(false)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [
    showRequiredFieldConfirmationDialog,
    setShowRequiredFieldConfirmationDialog,
  ] = useState(false)
  const [lastSavedAuthor, setLastSavedAuthor] = useState<string | null>(null)
  const [showingDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newAuthor, setNewAuthor] = useState(false)
  const [unSavedChanges, setUnSavedChanges] = useState(false)
  const [nextAuthor, setNextAuthor] = useState<ContributorAttrs | null>(null)
  const [isSwitchingAuthor, setIsSwitchingAuthor] = useState(false)
  const [isCreatingNewAuthor, setIsCreatingNewAuthor] = useState(false)

  const [authorDetailsTabHasError, setAuthorDetailsTabHasError] =
    useState(false)
  const [authorDetailsUnsavedContinue, setAuthorDetailsUnsavedContinue] =
    useState(false)
  const [authorTabIndex, setAuthorTabIndex] = useState(0)

  const valuesRef = useRef<ContributorAttrs>(undefined)
  const actionsRef = useRef<FormActions>(undefined)
  const authorFormRef = useRef<HTMLFormElement>(null)
  const [authors, dispatchAuthors] = useReducer(
    authorsReducer,
    $authors.sort(authorComparator)
  )

  useEffect(() => {
    if (addNewAuthor) {
      addAuthor()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addNewAuthor])

  const [selection, setSelection] = useState(author)

  const {
    selectedAffiliations,
    setSelectedAffiliations,
    selectAffiliation,
    affiliations,
  } = useManageAffiliations(selection, $affiliations)

  useEffect(() => {
    const currentAuthor = selection
    const relevantAffiliations = affiliations.filter((item) =>
      currentAuthor?.affiliationIDs?.includes(item.id)
    )
    setSelectedAffiliations(relevantAffiliations)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!unSavedChanges) {
      setAuthorDetailsUnsavedContinue(false)
    }
  }, [unSavedChanges])

  useEffect(() => {
    setAuthorDetailsUnsavedContinue(false)
  }, [selection?.id])

  useEffect(() => {
    if (selection?.id) {
      setAuthorTabIndex(0)
    }
  }, [selection?.id])

  const selectAuthor = (author: ContributorAttrs) => {
    if (author.id === selection?.id) {
      return
    }
    const values = valuesRef.current
    setIsCreatingNewAuthor(false)

    if (values && selection) {
      const normalizedSelection = normalizeAuthor(selection)
      const normalizedValues = normalizeAuthor(values)

      const hasChanges = !isEqual(normalizedSelection, normalizedValues)

      if (hasChanges && !isDisableSave) {
        setShowConfirmationDialog(true)
        setNextAuthor(author)
      } else if (hasChanges && isDisableSave) {
        setShowRequiredFieldConfirmationDialog(true)
        setNextAuthor(author)
      } else {
        updateAffiliationSelection(author)
        setSelection(author)
        setNewAuthor(false)
      }
    } else {
      updateAffiliationSelection(author)
      setSelection(author)
      setNewAuthor(false)
    }
  }
  const updateAffiliationSelection = (author: ContributorAttrs) => {
    const relevantAffiliations = affiliations.filter((item) =>
      author.affiliationIDs?.includes(item.id)
    )
    setSelectedAffiliations(relevantAffiliations)
  }
  const close = () => {
    if (unSavedChanges) {
      if (isDisableSave) {
        setShowRequiredFieldConfirmationDialog(true)
      } else {
        setShowConfirmationDialog(true)
      }
    } else {
      setShowRequiredFieldConfirmationDialog(false)
      setLastSavedAuthor(null)
      setOpen(false)
      setSelection(undefined)
    }
  }

  const cancel = () => {
    resetAuthor()
    if (nextAuthor) {
      const nextAuthorAffiliations = nextAuthor.affiliationIDs || []
      setSelectedAffiliations(
        affiliations.filter((item) => nextAuthorAffiliations.includes(item.id))
      )
      setSelection(nextAuthor)
      setNextAuthor(null)
      setNewAuthor(false)
      setIsCreatingNewAuthor(false)
      setUnSavedChanges(false)
    } else if (newAuthor && unSavedChanges && !isSwitchingAuthor) {
      setNewAuthor(false)
      setIsCreatingNewAuthor(false)
      setOpen(false)
    } else if (isCreatingNewAuthor) {
      createNewAuthor()
      setIsCreatingNewAuthor(false)
    }
    setShowConfirmationDialog(false)
    setShowRequiredFieldConfirmationDialog(false)
  }

  const saveAuthor = (values: ContributorAttrs | undefined) => {
    if (!values || !selection) {
      return
    }
    const author = {
      ...selection,
      ...values,
    }

    onSaveAuthor(author)
    setLastSavedAuthor(author.id)
    setTimeout(() => {
      setLastSavedAuthor(null)
    }, 3200)
    setUnSavedChanges(false)
    setSelection(author)
    setShowConfirmationDialog(false)
    setNewAuthor(false)
    setIsCreatingNewAuthor(false)
    dispatchAuthors({
      type: 'update',
      items: [author],
    })

    if (isOverlay) {
      setOpen(false)
    }
  }

  const moveAuthor = useCallback(
    (from: ContributorAttrs, to: ContributorAttrs, shift: number) => {
      const copy = cloneDeep(authors)
      const order = copy.map((a, i) => {
        if (a.id === from.id) {
          if (to.priority) {
            return to.priority + shift
          } else {
            return authors.findIndex((i) => i === to) + shift
          }
        }
        return i
      })
      copy.sort((a, b) => order[copy.indexOf(a)] - order[copy.indexOf(b)])
      copy.forEach((a, i) => {
        if (a.priority !== i) {
          a.priority = i
          onSaveAuthor(a)
        }
      })
      dispatchAuthors({
        type: 'set',
        state: copy,
      })
    },
    [authors, dispatchAuthors, onSaveAuthor]
  )
  const createNewAuthor = () => {
    const author = createEmptyAuthor(authors.length)
    setIsSwitchingAuthor(!!selection)
    setSelectedAffiliations([])
    setSelectedCreditRoles([])
    setSelection(author)
    setNewAuthor(true)
  }

  const addAuthor = () => {
    const values = valuesRef.current
    setIsSwitchingAuthor(!!selection)
    setIsCreatingNewAuthor(true)
    if (
      values &&
      selection &&
      !isEqual(normalizeAuthor(values), normalizeAuthor(selection))
    ) {
      if (isDisableSave) {
        setShowRequiredFieldConfirmationDialog(true)
      } else {
        setShowConfirmationDialog(true)
      }
      setNextAuthor(null)
    } else {
      createNewAuthor()
    }
  }

  const deleteAuthor = () => {
    if (!selection) {
      return
    }
    onDeleteAuthor(selection)
    setSelection(undefined)
    setUnSavedChanges(false)
    dispatchAuthors({
      type: 'delete',
      item: selection,
    })
  }

  const resetAuthor = () => {
    actionsRef.current?.reset()
    const selectedAffs = selection?.affiliationIDs || []
    setSelectedAffiliations(
      affiliations.filter((item) => selectedAffs.includes(item.id))
    )
    setShowConfirmationDialog(false)
    setShowRequiredFieldConfirmationDialog(false)
    setUnSavedChanges(false)
    if (!isCreatingNewAuthor && !nextAuthor) {
      setLastSavedAuthor(null)
      setOpen(false)
    } else if (isCreatingNewAuthor) {
      createNewAuthor()
    }
    setIsCreatingNewAuthor(false)
  }

  const changeAuthor = (values: ContributorAttrs) => {
    const normalized = omit(
      normalizeAuthor(selection as ContributorAttrs),
      'priority'
    )
    const updatedValues = omit(normalizeAuthor(values), 'priority')

    const isSameAuthor = updatedValues.id === normalized.id
    const hasChanges = !isEqual(updatedValues, normalized)
    setUnSavedChanges(isSameAuthor && hasChanges)

    valuesRef.current = { ...updatedValues, priority: values.priority }

    const { given, family, email, isCorresponding } = values
    const isNameFilled = given?.length || family?.length

    if (hasChanges && isNameFilled) {
      if (isCorresponding) {
        setDisableSave(!email?.length)
      } else {
        setDisableSave(false)
      }
    } else {
      setDisableSave(true)
    }

    setEmailRequired(isCorresponding)
  }

  const {
    selectCreditRole,
    selectedCreditRoles,
    setSelectedCreditRoles,
    vocabTermItems,
  } = useManageCredit(selection)

  const newEntity =
    newAuthor ||
    (isCreatingNewAuthor &&
      !showConfirmationDialog &&
      !showRequiredFieldConfirmationDialog)

  return (
    <StyledModal
      isOpen={isOpen}
      onRequestClose={() => close()}
      shouldCloseOnOverlayClick={true}
    >
      <ModalContainer
        data-cy="authors-modal"
        data-metadata-modal-overlay={isOverlay ? 'true' : undefined}
      >
        <ModalHeader>
          <CloseButton onClick={() => close()} data-cy="modal-close-button" />
        </ModalHeader>
        <StyledModalBody $isOverlay={isOverlay}>
          {!isOverlay && (
            <ModalSidebar data-cy="authors-sidebar">
              <StyledModalSidebarHeader>
                <ModalSidebarTitle>Manage Authors</ModalSidebarTitle>
              </StyledModalSidebarHeader>
              <StyledSidebarContent>
                <AddAuthorButton
                  data-cy="add-author-button"
                  onClick={addAuthor}
                  data-active={isCreatingNewAuthor || newAuthor}
                >
                  <AddIcon width={18} height={18} />
                  <ActionTitle>New Author</ActionTitle>
                </AddAuthorButton>
                <AuthorList
                  author={selection}
                  authors={authors}
                  onSelect={selectAuthor}
                  onDelete={() => setShowDeleteDialog((prev) => !prev)}
                  moveAuthor={moveAuthor}
                  lastSavedAuthor={lastSavedAuthor}
                />
              </StyledSidebarContent>
            </ModalSidebar>
          )}
          <StyledScrollableModalContent data-cy="author-modal-content">
            {selection ? (
              <>
                {isOverlay ? (
                  <>
                    <OverlayFormTitle>Create New Author</OverlayFormTitle>
                    <AuthorDetailsForm
                      values={normalizeAuthor(selection)}
                      onChange={changeAuthor}
                      onSave={saveAuthor}
                      actionsRef={actionsRef}
                      isEmailRequired={isEmailRequired}
                      selectedAffiliations={selectedAffiliations.map(
                        (a) => a.id
                      )}
                      authorFormRef={authorFormRef}
                      selectedCreditRoles={selectedCreditRoles}
                      newEntity={newEntity}
                      onAuthorDetailsTabErrorChange={
                        setAuthorDetailsTabHasError
                      }
                      unsavedContinueActive={authorDetailsUnsavedContinue}
                    />
                  </>
                ) : (
                  <AuthorTabs
                    selectedIndex={authorTabIndex}
                    onChange={setAuthorTabIndex}
                  >
                    <ModalFormActions
                      type="author"
                      onDelete={deleteAuthor}
                      showingDeleteDialog={showingDeleteDialog}
                      showDeleteDialog={() =>
                        setShowDeleteDialog((prev) => !prev)
                      }
                    />
                    <ModalTabs
                      tabLabels={[
                        'Author Details',
                        ...(onOpenAffiliationsModal ? ['Affiliations'] : []),
                        'Contributions',
                      ]}
                      tabErrorIndicators={[
                        authorDetailsTabHasError,
                        ...(onOpenAffiliationsModal ? [false] : []),
                        false,
                      ]}
                      tabWarningIndicators={[
                        authorDetailsUnsavedContinue &&
                          !authorDetailsTabHasError,
                        ...(onOpenAffiliationsModal ? [false] : []),
                        false,
                      ]}
                    />
                    <InspectorTabPanels>
                      <AuthorTabPanel>
                        <AuthorDetailsForm
                          values={normalizeAuthor(selection)}
                          onChange={changeAuthor}
                          onSave={saveAuthor}
                          actionsRef={actionsRef}
                          isEmailRequired={isEmailRequired}
                          selectedAffiliations={selectedAffiliations.map(
                            (a) => a.id
                          )}
                          authorFormRef={authorFormRef}
                          selectedCreditRoles={selectedCreditRoles}
                          newEntity={newEntity}
                          onAuthorDetailsTabErrorChange={
                            setAuthorDetailsTabHasError
                          }
                          unsavedContinueActive={authorDetailsUnsavedContinue}
                        />
                      </AuthorTabPanel>
                      {onOpenAffiliationsModal && (
                        <AuthorTabPanel>
                          <AffiliationsPanel
                            items={affiliations}
                            selectedItems={selectedAffiliations}
                            onSelect={selectAffiliation}
                            onOpenAffiliationsModal={onOpenAffiliationsModal}
                          />
                        </AuthorTabPanel>
                      )}
                      <AuthorTabPanel>
                        <FormSubtitle>Contributions (CRediT)</FormSubtitle>
                        <ContributionsDescriptionSubtitle>
                          Select the roles this author contributed to according
                          to the CRediT taxonomy
                        </ContributionsDescriptionSubtitle>
                        <CreditContributionsCheckboxes
                          items={vocabTermItems}
                          selectedItems={selectedCreditRoles.map((r) => ({
                            id: r.vocabTerm,
                          }))}
                          onSelect={selectCreditRole}
                        />
                      </AuthorTabPanel>
                    </InspectorTabPanels>
                  </AuthorTabs>
                )}
                <ConfirmationDialog
                  isOpen={showRequiredFieldConfirmationDialog}
                  onPrimary={() =>
                    setShowRequiredFieldConfirmationDialog(false)
                  }
                  onSecondary={cancel}
                  type={DialogType.REQUIRED}
                  entityType="author"
                />
                <ConfirmationDialog
                  isOpen={showConfirmationDialog}
                  onPrimary={() => {
                    setShowConfirmationDialog(false)
                    setNextAuthor(null)
                    setAuthorDetailsUnsavedContinue(true)
                  }}
                  onSecondary={cancel}
                  type={DialogType.SAVE}
                  entityType="author"
                />
              </>
            ) : (
              <FormPlaceholder
                type="author"
                title="Author Details"
                message="Select an author from the list to display their details here."
                placeholderIcon={<AuthorPlaceholderIcon />}
              />
            )}
          </StyledScrollableModalContent>
        </StyledModalBody>
        <FormFooter
          onCancel={close}
          primaryAction={
            selection ? (
              <ModalFormSaveButton
                form="author-details-form"
                newEntity={newEntity}
                isDisableSave={isDisableSave}
                createLabel={isOverlay ? 'Create New Author' : undefined}
                onSubmitForm={() => actionsRef.current?.submitForm?.()}
              />
            ) : undefined
          }
        />
      </ModalContainer>
    </StyledModal>
  )
}

function createEmptyAuthor(priority: number): ContributorAttrs {
  return {
    id: generateNodeID(schema.nodes.contributor),
    role: '',
    affiliationIDs: [],
    degrees: [],
    given: '',
    family: '',
    email: '',
    suffix: '',
    isCorresponding: false,
    ORCID: '',
    priority,
    isJointContributor: false,
    correspIDs: [],
    footnoteIDs: [],
    prefix: '',
    creditRoles: [],
  }
}

const AddAuthorButton = styled.button`
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

const AuthorTabs = styled(InspectorTabs)`
  position: relative;
`
const AuthorTabPanel = styled(InspectorTabPanel).attrs({
  tabIndex: -1,
  unmount: false,
})`
  margin-top: ${(props) => props.theme.grid.unit * 4}px;
`

const ContributionsDescriptionSubtitle = styled(FormSubtitle)`
  font-size: ${(props) => props.theme.font.size.small};
  line-height: ${(props) => props.theme.font.lineHeight.normal};
`

const StyledSidebarContent = styled(SidebarContent)`
  padding: 8px;
`

const StyledModalBody = styled(ModalBody)<{ $isOverlay?: boolean }>`
  position: relative;
  height: ${(p) => (p.$isOverlay ? 'calc(90vh - 350px)' : 'calc(90vh - 40px)')};
`

const StyledModalSidebarHeader = styled(ModalSidebarHeader)`
  margin-bottom: 12px;
`
const StyledScrollableModalContent = styled(ScrollableModalContent)`
  padding: 45px 16px 16px;
`

const OverlayFormTitle = styled.h2`
  margin: 0 0 ${(props) => props.theme.grid.unit * 3}px;
  font-family: ${(props) => props.theme.font.family.sans};
  font-size: ${(props) => props.theme.font.size.large};
  font-weight: ${(props) => props.theme.font.weight.semibold};
  line-height: ${(props) => props.theme.font.lineHeight.large};
  color: ${(props) => props.theme.colors.text.primary};
`
