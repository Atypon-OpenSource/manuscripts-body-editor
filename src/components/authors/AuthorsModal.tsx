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
  BibliographicName,
  buildBibliographicName,
} from '@manuscripts/json-schema'
import {
  AddIcon,
  AddInstitutionIcon,
  AddRoleIcon,
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
import { ModalFormActions } from '../form/ModalFormActions'
import { DrawerGroup } from '../modal-drawer/GenericDrawerGroup'
import { AffiliationsDrawer } from './AffiliationDrawer'
import { AuthorDetailsForm, FormActions } from './AuthorDetailsForm'
import { AuthorList } from './AuthorList'
import { CreditDrawer } from './CreditDrawer'
import { useManageAffiliations } from './useManageAffiliations'
import { useManageCredit } from './useManageCredit'

export const authorsReducer = arrayReducer<ContributorAttrs>(
  (a, b) => a.id === b.id
)

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
    return { dialogType: 'invalid', fieldName: 'email' }
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
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [
    showRequiredFieldConfirmationDialog,
    setShowRequiredFieldConfirmationDialog,
  ] = useState(false)
  const [showInvalidFieldDialog, setShowInvalidFieldDialog] = useState(false)
  const [invalidFieldName, setInvalidFieldName] = useState<string>('')
  const [lastSavedAuthor, setLastSavedAuthor] = useState<string | null>(null)
  const [showingDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newAuthor, setNewAuthor] = useState(false)
  const [unSavedChanges, setUnSavedChanges] = useState(false)
  const [nextAuthor, setNextAuthor] = useState<ContributorAttrs | null>(null)
  const [isSwitchingAuthor, setIsSwitchingAuthor] = useState(false)
  const [isCreatingNewAuthor, setIsCreatingNewAuthor] = useState(false)

  const [showCreditDrawer, setShowCreditDrawer] = useState(false)

  const valuesRef = useRef<ContributorAttrs>()
  const actionsRef = useRef<FormActions>()
  const authorFormRef = useRef<HTMLFormElement | null>(null)
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
    showAffiliationDrawer,
    setShowAffiliationDrawer,
    selectedAffiliations,
    setSelectedAffiliations,
    removeAffiliation,
    selectAffiliation,
    affiliations,
  } = useManageAffiliations(selection, $affiliations)

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
      const normalizedSelection = normalizeAuthor(selection)
      const normalizedValues = normalizeAuthor(values)

      const hasChanges = !isEqual(normalizedSelection, normalizedValues)

      if (hasChanges && !isDisableSave) {
        setShowConfirmationDialog(true)
        setNextAuthor(author)
      } else if (hasChanges && isDisableSave) {
        const validation = validateFormFields(values)
        if (validation.dialogType === 'invalid') {
          setInvalidFieldName(validation.fieldName || '')
          setShowInvalidFieldDialog(true)
        } else {
          setShowRequiredFieldConfirmationDialog(true)
        }
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
  const close = () => {
    if (unSavedChanges) {
      if (isDisableSave) {
        const validation = validateFormFields(valuesRef.current!)
        if (validation.dialogType === 'invalid') {
          setInvalidFieldName(validation.fieldName || '')
          setShowInvalidFieldDialog(true)
        } else {
          setShowRequiredFieldConfirmationDialog(true)
        }
      } else {
        setShowConfirmationDialog(true)
      }
    } else {
      setShowRequiredFieldConfirmationDialog(false)
      setShowInvalidFieldDialog(false)
      setLastSavedAuthor(null)
      setOpen(false)
    }
  }

  const save = () => {
    if (!authorFormRef.current?.checkValidity()) {
      setShowConfirmationDialog(false)
      setTimeout(() => {
        authorFormRef.current?.reportValidity()
      }, 830)
    } else {
      if (valuesRef.current && selection) {
        saveAuthor(valuesRef.current)
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

  const cancel = () => {
    resetAuthor()
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
    setShowInvalidFieldDialog(false)
    setShowAffiliationDrawer(false)
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
    setShowInvalidFieldDialog(false)
    setNewAuthor(false)
    setShowAffiliationDrawer(false)
    setIsCreatingNewAuthor(false)
    dispatchAuthors({
      type: 'update',
      items: [author],
    })
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
    const name = buildBibliographicName({ given: '', family: '' })
    const author = createEmptyAuthor(name, authors.length)
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
        const validation = validateFormFields(values)
        if (validation.dialogType === 'invalid') {
          setInvalidFieldName(validation.fieldName || '')
          setShowInvalidFieldDialog(true)
        } else {
          setShowRequiredFieldConfirmationDialog(true)
        }
      } else {
        setShowConfirmationDialog(true)
      }
      setNextAuthor(null)
    } else {
      createNewAuthor()
      setShowAffiliationDrawer(false)
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
    const selectedAffs = selection?.affiliations || []
    setSelectedAffiliations(
      affiliations.filter((item) => selectedAffs.includes(item.id))
    )
    setShowConfirmationDialog(false)
    setShowRequiredFieldConfirmationDialog(false)
    setShowInvalidFieldDialog(false)
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

    const validation = validateFormFields(values)
    if (hasChanges) {
      setDisableSave(validation.dialogType !== 'none')
    } else {
      setDisableSave(true)
    }

    setEmailRequired(values.isCorresponding)
  }

  const {
    removeCreditRole,
    selectCreditRole,
    selectedCreditRoles,
    setSelectedCreditRoles,
    vocabTermItems,
  } = useManageCredit(selection)

  return (
    <StyledModal
      isOpen={isOpen}
      onRequestClose={() => close()}
      shouldCloseOnOverlayClick={true}
    >
      <ModalContainer data-cy="authors-modal">
        <ModalHeader>
          <CloseButton onClick={() => close()} data-cy="modal-close-button" />
        </ModalHeader>
        <StyledModalBody>
          <ModalSidebar data-cy="authors-sidebar">
            <StyledModalSidebarHeader>
              <ModalSidebarTitle>Authors</ModalSidebarTitle>
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
          <DrawerRelativeParent>
            <ScrollableModalContent data-cy="author-modal-content">
              {selection ? (
                <AuthorForms>
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
                    isOpen={showInvalidFieldDialog}
                    onPrimary={() => setShowInvalidFieldDialog(false)}
                    onSecondary={cancel}
                    type={DialogType.INVALID}
                    entityType="author"
                    fieldName={invalidFieldName}
                  />
                  <ConfirmationDialog
                    isOpen={showConfirmationDialog}
                    onPrimary={save}
                    onSecondary={cancel}
                    type={DialogType.SAVE}
                    entityType="author"
                  />
                  <ModalFormActions
                    form={'author-details-form'}
                    type="author"
                    onDelete={deleteAuthor}
                    showingDeleteDialog={showingDeleteDialog}
                    showDeleteDialog={() =>
                      setShowDeleteDialog((prev) => !prev)
                    }
                    newEntity={
                      newAuthor ||
                      (isCreatingNewAuthor &&
                        !showConfirmationDialog &&
                        !showRequiredFieldConfirmationDialog &&
                        !showInvalidFieldDialog)
                    }
                    isDisableSave={isDisableSave}
                  />
                  <FormLabel>Details</FormLabel>
                  <AuthorDetailsForm
                    values={normalizeAuthor(selection)}
                    onChange={changeAuthor}
                    onSave={saveAuthor}
                    actionsRef={actionsRef}
                    isEmailRequired={isEmailRequired}
                    selectedAffiliations={selectedAffiliations.map((a) => a.id)}
                    authorFormRef={authorFormRef}
                    selectedCreditRoles={selectedCreditRoles}
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
                    Drawer={CreditDrawer}
                    removeItem={removeCreditRole}
                    selectedItems={selectedCreditRoles.map((r) => ({
                      id: r.vocabTerm,
                      ...r,
                    }))}
                    onSelect={selectCreditRole}
                    items={vocabTermItems}
                    showDrawer={showCreditDrawer}
                    setShowDrawer={setShowCreditDrawer}
                    title="Contributions (Credit)"
                    buttonText="Assign Credit Roles"
                    cy="credit-taxnonomy"
                    labelField="vocabTerm"
                    Icon={<AddRoleIcon width={16} height={16} />}
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
        <FormFooter onCancel={close} />
      </ModalContainer>
    </StyledModal>
  )
}

function createEmptyAuthor(
  name: BibliographicName,
  priority: number
): ContributorAttrs {
  return {
    id: generateNodeID(schema.nodes.contributor),
    role: '',
    affiliations: [],
    bibliographicName: name,
    email: '',
    isCorresponding: false,
    ORCIDIdentifier: '',
    priority,
    isJointContributor: false,
    userID: '',
    invitationID: '',
    corresp: [],
    footnote: [],
    prefix: '',
  }
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
