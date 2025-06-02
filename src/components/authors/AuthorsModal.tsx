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
  buildBibliographicName,
  generateID,
  ObjectTypes,
} from '@manuscripts/json-schema'
import {
  AddIcon,
  AddInstitutionIcon,
  AuthorPlaceholderIcon,
  CloseButton,
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
import { cloneDeep, isEqual, omit } from 'lodash'
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import styled from 'styled-components'

import { arrayReducer } from '../../lib/array-reducer'
import {
  AffiliationAttrs,
  authorComparator,
  ContributorAttrs,
} from '../../lib/authors'
import { ConfirmationDialog, DialogType } from '../dialog/ConfirmationDialog'
import FormFooter from '../form/FormFooter'
import { FormPlaceholder } from '../form/FormPlaceholder'
import { ModalFormActions } from '../form/ModalFormActions'
import { AuthorDetailsForm, FormActions } from './AuthorDetailsForm'
import { AuthorList } from './AuthorList'
import { normalize } from './lib'
import { DrawerGroup } from './GenericDrawerGroup'
import { AffiliationsDrawer } from './AffiliationDrawer'
import { CRediTRole } from '@manuscripts/transform'
import { CreditVocabTerm } from '@manuscripts/transform'
import { CRediTDrawer } from './CreditDrawer'

export const authorsReducer = arrayReducer<ContributorAttrs>(
  (a, b) => a.id === b.id
)
export const affiliationsReducer = arrayReducer<AffiliationAttrs>(
  (a, b) => a.id === b.id
)

export interface AuthorsModalProps {
  author?: ContributorAttrs
  authors: ContributorAttrs[]
  affiliations: AffiliationAttrs[]
  onSaveAuthor: (author: ContributorAttrs) => void
  onDeleteAuthor: (author: ContributorAttrs) => void
  addNewAuthor?: boolean
}

export const AuthorsModal: React.FC<AuthorsModalProps> = ({
  authors: $authors,
  affiliations: $affiliations,
  author,
  onSaveAuthor,
  onDeleteAuthor,
  addNewAuthor = false,
}) => {
  const [isOpen, setOpen] = useState(true)
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
  const [showAffiliationDrawer, setShowAffiliationDrawer] = useState(false)

  const [showCRediTDrawer, setShowCRediTDrawer] = useState(false)

  const [selectedAffiliations, setSelectedAffiliations] = useState<
    {
      id: string
      institution: string
    }[]
  >([])
  const valuesRef = useRef<ContributorAttrs>()
  const actionsRef = useRef<FormActions>()
  const authorFormRef = useRef<HTMLFormElement | null>(null)
  const [authors, dispatchAuthors] = useReducer(
    authorsReducer,
    $authors.sort(authorComparator)
  )
  const [affiliations] = useReducer(affiliationsReducer, $affiliations)

  useEffect(() => {
    if (addNewAuthor) {
      handleAddAuthor()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addNewAuthor])

  const [selection, setSelection] = useState(author)

  useEffect(() => {
    const currentAuthor = selection
    const relevantAffiliations = affiliations.filter((item) =>
      currentAuthor?.affiliations?.includes(item.id)
    )
    setSelectedAffiliations(relevantAffiliations)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectAuthor = (author: ContributorAttrs) => {
    if (author.id === selection?.id) {
      return
    }
    const values = valuesRef.current
    setIsCreatingNewAuthor(false)

    if (values && selection) {
      const normalizedSelection = normalize(selection)
      const normalizedValues = normalize(values)

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
        setShowAffiliationDrawer(false)
        setNewAuthor(false)
      }
    } else {
      setShowAffiliationDrawer(false)
      updateAffiliationSelection(author)
      setSelection(author)
      setNewAuthor(false)
    }
  }
  const updateAffiliationSelection = (author: ContributorAttrs) => {
    const relevantAffiliations = affiliations.filter((item) =>
      author.affiliations?.includes(item.id)
    )
    setSelectedAffiliations(relevantAffiliations)
  }
  const handleClose = () => {
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
    }
  }

  const handleSave = () => {
    if (!authorFormRef.current?.checkValidity()) {
      setShowConfirmationDialog(false)
      setTimeout(() => {
        authorFormRef.current?.reportValidity()
      }, 830)
    } else {
      if (valuesRef.current && selection) {
        handleSaveAuthor(valuesRef.current)
      }

      if (nextAuthor) {
        setSelection(nextAuthor)
        setNextAuthor(null)
        setNewAuthor(false)
        setShowAffiliationDrawer(false)
        updateAffiliationSelection(nextAuthor)
        setIsCreatingNewAuthor(false)
      } else if (isCreatingNewAuthor) {
        createNewAuthor()
        setIsCreatingNewAuthor(false)
      }

      setShowConfirmationDialog(false)
    }
  }

  const handleCancel = () => {
    handleResetAuthor()
    if (nextAuthor) {
      const nextAuthorAffiliations = nextAuthor.affiliations || []
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
    setShowAffiliationDrawer(false)
  }

  const handleSaveAuthor = (values: ContributorAttrs | undefined) => {
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
    setShowAffiliationDrawer(false)
    setIsCreatingNewAuthor(false)
    dispatchAuthors({
      type: 'update',
      items: [author],
    })
  }

  const moveAuthor = (
    from: ContributorAttrs,
    to: ContributorAttrs,
    shift: number
  ) => {
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
  }
  const createNewAuthor = () => {
    const name = buildBibliographicName({ given: '', family: '' })
    const author: ContributorAttrs = {
      id: generateID(ObjectTypes.Contributor),
      role: '',
      affiliations: [],
      bibliographicName: name,
      email: '',
      isCorresponding: false,
      ORCIDIdentifier: '',
      priority: authors.length,
      isJointContributor: false,
      userID: '',
      invitationID: '',
      corresp: [],
      footnote: [],
      prefix: '',
    }
    setIsSwitchingAuthor(!!selection)
    setSelectedAffiliations([])
    setSelection(author)
    setNewAuthor(true)
  }

  const handleAddAuthor = () => {
    const values = valuesRef.current
    setIsSwitchingAuthor(!!selection)
    setIsCreatingNewAuthor(true)
    if (
      values &&
      selection &&
      !isEqual(normalize(values), normalize(selection))
    ) {
      if (isDisableSave) {
        setShowRequiredFieldConfirmationDialog(true)
      } else {
        setShowConfirmationDialog(true)
      }
      setNextAuthor(null)
    } else {
      createNewAuthor()
      setShowAffiliationDrawer(false)
    }
  }

  const handleDeleteAuthor = () => {
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

  const removeAffiliation = (affId: string) => {
    if (!selection) {
      return
    }
    const newAffiliations = selectedAffiliations
      .map((a) => a.id)
      .filter((id) => id !== affId)
    setSelectedAffiliations(
      affiliations.filter((item) => newAffiliations.includes(item.id))
    )
  }

  const handleResetAuthor = () => {
    actionsRef.current?.reset()
    const selectedAffs = selection?.affiliations || []
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

  const handleChangeAuthor = (values: ContributorAttrs) => {
    const normalized = omit(
      normalize(selection as ContributorAttrs),
      'priority'
    )
    const updatedValues = omit(normalize(values), 'priority')

    const isSameAuthor = updatedValues.id === normalized.id
    const hasChanges = !isEqual(updatedValues, normalized)
    setUnSavedChanges(isSameAuthor && hasChanges)

    valuesRef.current = { ...updatedValues, priority: values.priority }

    const { given, family } = values.bibliographicName
    const { email, isCorresponding } = values
    const isNameFilled = given?.length && family?.length

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

  const selectAffiliation = (affiliationId: string) => {
    if (!selection) {
      return
    }

    const currentAffiliations = selectedAffiliations.map((a) => a.id)
    const isAlreadySelected = currentAffiliations.includes(affiliationId)

    const newAffiliations = isAlreadySelected
      ? currentAffiliations.filter((id) => id !== affiliationId)
      : [...currentAffiliations, affiliationId]

    setSelectedAffiliations(
      affiliations.filter((item) => newAffiliations.includes(item.id))
    )
  }

  const vocabTermItems = useMemo(() => {
    return Object.values(CreditVocabTerm).map((c) => ({
      vocabTerm: c,
      id: c,
    }))
  }, [])

  useEffect(() => {
    setSelectedCRediTRoles(selection?.CRediTRoles ? selection?.CRediTRoles : [])
  }, [selection])

  const [selectedCRediTRoles, setSelectedCRediTRoles] = useState<CRediTRole[]>(
    []
  )

  const selectCRediTRole = (role: string) => {
    setSelectedCRediTRoles((prev) => {
      const clear = prev.filter((t) => t.vocabTerm !== role)
      if (clear.length !== prev.length) {
        return clear
      }
      const newTerm = vocabTermItems.find((t) => t.vocabTerm === role)
      if (newTerm) {
        return [...prev, { vocabTerm: newTerm.vocabTerm }]
      }
      return prev
    })
  }

  const removeCReditRole = (role: string) => {
    setSelectedCRediTRoles((prev) => {
      return prev.filter((r) => r.vocabTerm !== role)
    })
  }

  return (
    <StyledModal
      isOpen={isOpen}
      onRequestClose={() => handleClose()}
      shouldCloseOnOverlayClick={true}
    >
      <ModalContainer data-cy="authors-modal">
        <ModalHeader>
          <CloseButton
            onClick={() => handleClose()}
            data-cy="modal-close-button"
          />
        </ModalHeader>
        <StyledModalBody>
          <ModalSidebar data-cy="authors-sidebar">
            <StyledModalSidebarHeader>
              <ModalSidebarTitle>Authors</ModalSidebarTitle>
            </StyledModalSidebarHeader>
            <StyledSidebarContent>
              <AddAuthorButton
                data-cy="add-author-button"
                onClick={handleAddAuthor}
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
          <DrawerRelativeParent>
            <ScrollableModalContent data-cy="author-modal-content">
              {selection ? (
                <AuthorForms>
                  <ConfirmationDialog
                    isOpen={showRequiredFieldConfirmationDialog}
                    onPrimary={() =>
                      setShowRequiredFieldConfirmationDialog(false)
                    }
                    onSecondary={handleCancel}
                    type={DialogType.REQUIRED}
                    entityType="author"
                  />
                  <ConfirmationDialog
                    isOpen={showConfirmationDialog}
                    onPrimary={handleSave}
                    onSecondary={handleCancel}
                    type={DialogType.SAVE}
                    entityType="author"
                  />
                  <ModalFormActions
                    form={'author-details-form'}
                    type="author"
                    onDelete={handleDeleteAuthor}
                    showingDeleteDialog={showingDeleteDialog}
                    showDeleteDialog={() =>
                      setShowDeleteDialog((prev) => !prev)
                    }
                    newEntity={
                      newAuthor ||
                      (isCreatingNewAuthor &&
                        !showConfirmationDialog &&
                        !showRequiredFieldConfirmationDialog)
                    }
                    isDisableSave={isDisableSave}
                  />
                  <FormLabel>Details</FormLabel>
                  <AuthorDetailsForm
                    values={normalize(selection)}
                    onChange={handleChangeAuthor}
                    onSave={handleSaveAuthor}
                    actionsRef={actionsRef}
                    isEmailRequired={isEmailRequired}
                    selectedAffiliations={selectedAffiliations.map((a) => a.id)}
                    authorFormRef={authorFormRef}
                    selectedCRediTRoles={selectedCRediTRoles}
                  />
                  <DrawerGroup<AffiliationAttrs>
                    Drawer={AffiliationsDrawer}
                    removeItem={removeAffiliation}
                    selectedItems={selectedAffiliations}
                    onSelect={selectAffiliation}
                    items={affiliations}
                    showDrawer={showAffiliationDrawer}
                    setShowDrawer={setShowAffiliationDrawer}
                    title="Affiliations"
                    buttonText="Assign Institutions"
                    cy="affiliations"
                    labelField="institution"
                    Icon={<AddInstitutionIcon width={16} height={16} />}
                  />
                  <DrawerGroup<{ id: string; vocabTerm: string }>
                    Drawer={CRediTDrawer}
                    removeItem={removeCReditRole}
                    selectedItems={selectedCRediTRoles.map((r) => ({
                      id: r.vocabTerm,
                      ...r,
                    }))}
                    onSelect={selectCRediTRole}
                    items={vocabTermItems}
                    showDrawer={showCRediTDrawer}
                    setShowDrawer={setShowCRediTDrawer}
                    title="Contributions (CRediT)"
                    buttonText="Assign CRediT Roles"
                    cy="credit-taxnonomy"
                    labelField="vocabTerm"
                    Icon={<AddInstitutionIcon width={16} height={16} />}
                  />
                </AuthorForms>
              ) : (
                <FormPlaceholder
                  type="author"
                  title="Author Details"
                  message="Select an author from the list to display their details here."
                  placeholderIcon={<AuthorPlaceholderIcon />}
                />
              )}
            </ScrollableModalContent>
          </DrawerRelativeParent>
        </StyledModalBody>
        <FormFooter onCancel={handleClose} />
      </ModalContainer>
    </StyledModal>
  )
}

const AddAuthorButton = styled.div`
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
`

const ActionTitle = styled.div`
  padding-left: ${(props) => props.theme.grid.unit * 2}px;
`

const FormLabel = styled.legend`
  margin-bottom: 12px;
  font: ${(props) => props.theme.font.weight.normal}
    ${(props) => props.theme.font.size.xlarge} /
    ${(props) => props.theme.font.lineHeight.large}
    ${(props) => props.theme.font.family.sans};
  letter-spacing: -0.4px;
  color: ${(props) => props.theme.colors.text.secondary};
`

const AuthorForms = styled.div`
  padding-left: ${(props) => props.theme.grid.unit * 3}px;
  padding-right: ${(props) => props.theme.grid.unit * 3}px;
  margin-top: 20px;
`

const StyledSidebarContent = styled(SidebarContent)`
  padding: 0;
`

const StyledModalBody = styled(ModalBody)`
  position: relative;
  height: calc(90vh - 40px);
`

const StyledModalSidebarHeader = styled(ModalSidebarHeader)`
  margin-bottom: 16px;
`
const DrawerRelativeParent = styled.div`
  position: relative;
`
