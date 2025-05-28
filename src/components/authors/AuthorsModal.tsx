/*!
 * © 2024 Atypon Systems LLC
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
import { cloneDeep, isEqual, omit } from 'lodash'
import React, { useEffect, useReducer, useRef, useState } from 'react'
import styled from 'styled-components'

import { arrayReducer } from '../../lib/array-reducer'
import {
  AffiliationAttrs,
  authorComparator,
  ContributorAttrs,
} from '../../lib/authors'
import {
  ConfirmationDialog,
  ConfirmationDialogProps,
  DialogType,
} from '../dialog/ConfirmationDialog'
import FormFooter from '../form/FormFooter'
import { FormPlaceholder } from '../form/FormPlaceholder'
import { ModalFormActions } from '../form/ModalFormActions'
import { AuthorDetailsForm, FormActions } from './AuthorDetailsForm'
import { AuthorList } from './AuthorList'

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
  position: relative;
  margin-top: 20px;
`

const StyledSidebarContent = styled(SidebarContent)`
  padding: 0;
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
  margin-bottom: 16px;
`

export const authorsReducer = arrayReducer<ContributorAttrs>(
  (a, b) => a.id === b.id
)
export const affiliationsReducer = arrayReducer<AffiliationAttrs>(
  (a, b) => a.id === b.id
)

const normalize = (author: ContributorAttrs) => ({
  id: author.id,
  role: author.role || 'author',
  affiliations: (author.affiliations || []).sort(),
  bibliographicName: author.bibliographicName,
  email: author.email || '',
  isCorresponding: author.isCorresponding || false,
  ORCIDIdentifier: author.ORCIDIdentifier || '',
  priority: author.priority || 0,
  isJointContributor: author.isJointContributor || false,
  userID: author.userID || '',
  invitationID: author.invitationID || '',
  footnote: author.footnote || [],
  corresp: author.corresp || [],
  prefix: author.prefix || '',
})

const validateFormFields = (
  values: ContributorAttrs
): { dialogType: 'required' | 'invalid' | 'none'; fieldName?: string } => {
  const { given, family } = values.bibliographicName
  const { email, isCorresponding } = values

  // Check for required name fields
  if (!given || !family) {
    return { dialogType: 'required', fieldName: 'name' }
  }

  // Check email requirements
  const isEmailRequired = isCorresponding
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (isEmailRequired && !email) {
    return { dialogType: 'required', fieldName: 'email' }
  }
  if (email && !emailRegex.test(email)) {
    return { dialogType: 'invalid', fieldName: 'field' }
  }

  return { dialogType: 'none' }
}

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
  const [dialogState, setDialogState] = useState<
    Partial<ConfirmationDialogProps> | undefined
  >(undefined)
  const [lastSavedAuthor, setLastSavedAuthor] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newAuthor, setNewAuthor] = useState(false)
  const [unSavedChanges, setUnSavedChanges] = useState(false)
  const [nextAuthor, setNextAuthor] = useState<ContributorAttrs | null>(null)
  const [isSwitchingAuthor, setIsSwitchingAuthor] = useState(false)
  const [isCreatingNewAuthor, setIsCreatingNewAuthor] = useState(false)
  const [showAffiliationDrawer, setShowAffiliationDrawer] = useState(false)
  const [selectedAffiliations, setSelectedAffiliations] = useState<
    { id: string; label: string }[]
  >([])
  const valuesRef = useRef<ContributorAttrs>()
  const actionsRef = useRef<FormActions>()
  const authorFormRef = useRef<HTMLFormElement | null>(null)
  const [authors, dispatchAuthors] = useReducer(
    authorsReducer,
    $authors.sort(authorComparator)
  )
  const [affiliations] = useReducer(affiliationsReducer, $affiliations)

  const affiliationItems = affiliations.map((affiliation) => ({
    id: affiliation.id,
    label: affiliation.institution,
    country: affiliation.country,
    city: affiliation.city,
    state: affiliation.county,
  }))

  const [selectedAffiliationIds, setSelectedAffiliationIds] = useState<
    string[]
  >([])
  const [selection, setSelection] = useState(author)

  useEffect(() => {
    if (addNewAuthor) {
      handleAddAuthor()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addNewAuthor])

  useEffect(() => {
    const currentAuthor = selection
    const relevantAffiliations = affiliationItems.filter((item) =>
      currentAuthor?.affiliations?.includes(item.id)
    )
    setSelectedAffiliations(relevantAffiliations)
    setSelectedAffiliationIds(relevantAffiliations.map((item) => item.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection])

  // Unified helper function to show dialogs
  const showDialog = (
    type: DialogType,
    fieldName?: string,
    onPrimary?: () => void,
    onSecondary?: () => void
  ) => {
    setDialogState({
      isOpen: true,
      type,
      entityType: 'author',
      fieldName,
      onPrimary: onPrimary ?? (() => setDialogState(undefined)),
      onSecondary: onSecondary ?? (() => {}),
    })
  }

  const handleSelect = (author: ContributorAttrs) => {
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
        showDialog(DialogType.SAVE, undefined, handleSave, handleCancel)
        setNextAuthor(author)
      } else if (hasChanges && isDisableSave) {
        const validation = validateFormFields(values)
        if (validation.dialogType !== 'none') {
          showDialog(
            validation.dialogType === 'required'
              ? DialogType.REQUIRED
              : DialogType.INVALID,
            validation.fieldName,
            undefined,
            handleCancel
          )
          setNextAuthor(author)
        } else {
          updateAffiliationSelection(author)
          setSelection(author)
          setShowAffiliationDrawer(false)
          setNewAuthor(false)
        }
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
    const relevantAffiliations = affiliationItems.filter((item) =>
      author.affiliations?.includes(item.id)
    )
    setSelectedAffiliations(relevantAffiliations)
    setSelectedAffiliationIds(relevantAffiliations.map((item) => item.id))
  }
  const handleClose = () => {
    if (unSavedChanges) {
      if (isDisableSave) {
        const validation = validateFormFields(valuesRef.current!)
        if (validation.dialogType !== 'none') {
          showDialog(
            validation.dialogType === 'required'
              ? DialogType.REQUIRED
              : DialogType.INVALID,
            validation.fieldName,
            undefined,
            handleCancel
          )
        }
      } else {
        showDialog(DialogType.SAVE, undefined, handleSave, handleCancel)
      }
    } else {
      setDialogState(undefined)
      setLastSavedAuthor(null)
      setOpen(false)
    }
  }

  const handleSave = () => {
    if (!authorFormRef.current?.checkValidity()) {
      setDialogState(undefined)
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

      setDialogState(undefined)
    }
  }

  const handleCancel = () => {
    handleResetAuthor()
    if (nextAuthor) {
      const affiliations = nextAuthor.affiliations || []
      setSelectedAffiliationIds(affiliations)
      setSelectedAffiliations(
        affiliationItems.filter((item) => affiliations.includes(item.id))
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
    setDialogState(undefined)
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
    setDialogState(undefined)
    setNewAuthor(false)
    setShowAffiliationDrawer(false)
    setIsCreatingNewAuthor(false)
    dispatchAuthors({
      type: 'update',
      items: [author],
    })
  }

  const handleMoveAuthor = (
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
    setSelectedAffiliationIds([])
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
        const validation = validateFormFields(values)
        if (validation.dialogType !== 'none') {
          showDialog(
            validation.dialogType === 'required'
              ? DialogType.REQUIRED
              : DialogType.INVALID,
            validation.fieldName,
            undefined,
            handleCancel
          )
        }
        setNextAuthor(null)
      } else {
        showDialog(DialogType.SAVE, undefined, handleSave, handleCancel)
        setNextAuthor(null)
      }
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

  const handleRemoveAffiliation = (affId: string) => {
    if (!selection) {
      return
    }

    const newAffiliations = selectedAffiliationIds.filter((id) => id !== affId)

    setSelectedAffiliationIds(newAffiliations)
    setSelectedAffiliations(
      affiliationItems.filter((item) => newAffiliations.includes(item.id))
    )
  }

  const handleResetAuthor = () => {
    actionsRef.current?.reset()
    const affiliations = selection?.affiliations || []
    setSelectedAffiliationIds(affiliations)
    setSelectedAffiliations(
      affiliationItems.filter((item) => affiliations.includes(item.id))
    )
    setDialogState(undefined)
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

    if (isSameAuthor && hasChanges) {
      setUnSavedChanges(true)
    } else {
      setUnSavedChanges(false)
    }

    valuesRef.current = { ...updatedValues, priority: values.priority }

    const validation = validateFormFields(values)
    if (hasChanges) {
      setDisableSave(validation.dialogType !== 'none')
    } else {
      setDisableSave(true)
    }

    setEmailRequired(values.isCorresponding)
  }

  const handleShowDeleteDialog = () => {
    setShowDeleteDialog((prev) => !prev)
  }

  const handleAffiliationSelect = (affiliationId: string) => {
    if (!selection) {
      return
    }

    const currentAffiliations = selectedAffiliationIds || []
    const isAlreadySelected = currentAffiliations.includes(affiliationId)

    const newAffiliations = isAlreadySelected
      ? currentAffiliations.filter((id) => id !== affiliationId)
      : [...currentAffiliations, affiliationId]

    setSelectedAffiliationIds(newAffiliations)
    setSelectedAffiliations(
      affiliationItems.filter((item) => newAffiliations.includes(item.id))
    )
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
                onSelect={handleSelect}
                onDelete={handleShowDeleteDialog}
                moveAuthor={handleMoveAuthor}
                lastSavedAuthor={lastSavedAuthor}
              />
            </StyledSidebarContent>
          </ModalSidebar>
          <ScrollableModalContent data-cy="author-modal-content">
            {selection ? (
              <AuthorForms>
                {dialogState && (
                  <ConfirmationDialog
                    isOpen={true}
                    type={dialogState.type ?? DialogType.REQUIRED}
                    entityType={dialogState.entityType ?? 'author'}
                    fieldName={dialogState.fieldName}
                    onPrimary={
                      dialogState.onPrimary ?? (() => setDialogState(undefined))
                    }
                    onSecondary={dialogState.onSecondary ?? (() => {})}
                  />
                )}
                <ModalFormActions
                  form={'author-details-form'}
                  type="author"
                  onDelete={handleDeleteAuthor}
                  showDeleteDialog={showDeleteDialog}
                  handleShowDeleteDialog={handleShowDeleteDialog}
                  newEntity={newAuthor || (isCreatingNewAuthor && !dialogState)}
                  isDisableSave={isDisableSave}
                />
                <FormLabel>Details</FormLabel>
                <AuthorDetailsForm
                  values={normalize(selection)}
                  onChange={handleChangeAuthor}
                  onSave={handleSaveAuthor}
                  actionsRef={actionsRef}
                  isEmailRequired={isEmailRequired}
                  selectedAffiliations={selectedAffiliationIds}
                  authorFormRef={authorFormRef}
                />
                <AuthorsSection>
                  <AuthorsHeader>
                    <AuthorsTitle>Authors</AuthorsTitle>
                    <AffiliateButton
                      onClick={() => setShowAffiliationDrawer(true)}
                      data-cy="affiliate-authors-button"
                    >
                      <AddInstitutionIcon width={16} height={16} />
                      Assign Institutions
                    </AffiliateButton>
                  </AuthorsHeader>
                  <SelectedItemsBox
                    data-cy="author-affiliations"
                    items={selectedAffiliations}
                    onRemove={handleRemoveAffiliation}
                    placeholder="No institutions assigned"
                  />
                </AuthorsSection>
                {showAffiliationDrawer && (
                  <Drawer
                    items={affiliationItems}
                    selectedIds={selectedAffiliationIds}
                    title="Authors"
                    onSelect={handleAffiliationSelect}
                    onBack={() => setShowAffiliationDrawer(false)}
                    width="100%"
                  />
                )}
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
        </StyledModalBody>
        <FormFooter onCancel={handleClose} />
      </ModalContainer>
    </StyledModal>
  )
}
