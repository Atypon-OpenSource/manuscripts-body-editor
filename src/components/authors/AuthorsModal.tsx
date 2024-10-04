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
import { isEqual } from 'lodash'
import React, { useReducer, useRef, useState } from 'react'
import styled from 'styled-components'

import { arrayReducer } from '../../lib/array-reducer'
import {
  AffiliationAttrs,
  authorComparator,
  ContributorAttrs,
} from '../../lib/authors'
import { AuthorActions } from './AuthorActions'
import { AuthorAffiliations } from './AuthorAffiliations'
import { AuthorDetailsForm, FormActions } from './AuthorDetailsForm'
import { AuthorFormPlaceholder } from './AuthorFormPlaceholder'
import { AuthorList } from './AuthorList'
import { SaveAuthorConfirmationDialog } from './SaveAuthorConfirmationDialog'

const AddAuthorButton = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${(props) => props.theme.grid.unit * 4}px;
  margin-left: ${(props) => props.theme.grid.unit * 2}px;
  cursor: pointer;
`

const ActionTitle = styled.div`
  padding-left: ${(props) => props.theme.grid.unit * 2}px;
`

const FormLabel = styled.legend`
  margin-top: 12px;
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
`

const authorsReducer = arrayReducer<ContributorAttrs>((a, b) => a.id === b.id)
const affiliationsReducer = arrayReducer<AffiliationAttrs>(
  (a, b) => a.id === b.id
)

const normalize = (author: ContributorAttrs) => ({
  id: author.id,
  role: author.role,
  affiliations: author.affiliations || [],
  bibliographicName: author.bibliographicName,
  email: author.email || '',
  isCorresponding: author.isCorresponding || false,
  ORCIDIdentifier: author.ORCIDIdentifier || '',
  priority: author.priority,
  isJointContributor: author.isJointContributor || false,
  userID: '',
  invitationID: '',
  footnote: author.footnote || [],
  corresp: author.corresp || [],
})

export interface AuthorsModalProps {
  author?: ContributorAttrs
  authors: ContributorAttrs[]
  affiliations: AffiliationAttrs[]
  onSaveAuthor: (author: ContributorAttrs) => void
  onDeleteAuthor: (author: ContributorAttrs) => void
  onSaveAffiliation: (affiliation: AffiliationAttrs) => void
}

export const AuthorsModal: React.FC<AuthorsModalProps> = ({
  authors: $authors,
  affiliations: $affiliations,
  author,
  onSaveAuthor,
  onDeleteAuthor,
  onSaveAffiliation,
}) => {
  const [isOpen, setOpen] = useState(true)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const valuesRef = useRef<ContributorAttrs>()
  const actionsRef = useRef<FormActions>()

  const [authors, dispatchAuthors] = useReducer(
    authorsReducer,
    $authors.sort(authorComparator)
  )
  const [affiliations, dispatchAffiliations] = useReducer(
    affiliationsReducer,
    $affiliations
  )

  const [selection, setSelection] = useState(author)

  const handleSelect = (author: ContributorAttrs) => {
    const values = valuesRef.current
    if (values && selection && !isEqual(values, normalize(selection))) {
      setShowConfirmationDialog(true)
    } else {
      setSelection(author)
    }
  }

  const handleClose = () => {
    const values = valuesRef.current
    if (values && selection && !isEqual(values, normalize(selection))) {
      setShowConfirmationDialog(true)
    } else {
      setOpen(false)
    }
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
    setSelection(author)
    setShowConfirmationDialog(false)
    dispatchAuthors({
      type: 'update',
      items: [author],
    })
  }

  const handleMoveAuthor = (from: number, to: number) => {
    const copy = [...authors]
    const order = copy.map((_, i) => (i === from ? to : i))
    copy.sort((a, b) => order[authors.indexOf(a)] - order[authors.indexOf(b)])
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

  const handleAddAuthor = () => {
    const name = buildBibliographicName({ given: '', family: '' })
    const author: ContributorAttrs = {
      id: generateID(ObjectTypes.Contributor),
      role: 'author',
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
    }
    onSaveAuthor(author)
    setSelection(author)
    dispatchAuthors({
      type: 'update',
      items: [author],
    })
  }

  const handleDeleteAuthor = () => {
    if (!selection) {
      return
    }
    onDeleteAuthor(selection)
    setSelection(undefined)
    dispatchAuthors({
      type: 'delete',
      item: selection,
    })
  }

  const handleSaveAffiliation = (affiliation: AffiliationAttrs) => {
    onSaveAffiliation(affiliation)
    dispatchAffiliations({
      type: 'update',
      items: [affiliation],
    })
  }

  const handleAddAffiliation = (affiliation: AffiliationAttrs) => {
    if (!valuesRef.current) {
      return
    }
    const values = valuesRef.current
    const affiliations = values.affiliations || []
    handleSaveAuthor({
      ...values,
      affiliations: [...affiliations, affiliation.id],
    })
  }

  const handleRemoveAffiliation = (affiliation: AffiliationAttrs) => {
    if (!valuesRef.current) {
      return
    }
    const values = valuesRef.current
    handleSaveAuthor({
      ...values,
      affiliations: values.affiliations?.filter((i) => i !== affiliation.id),
    })
  }

  const handleResetAuthor = () => {
    actionsRef.current?.reset()
    setShowConfirmationDialog(false)
  }

  const handleChangeAuthor = (values: ContributorAttrs) => {
    valuesRef.current = values
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
        <ModalBody>
          <ModalSidebar data-cy="authors-sidebar">
            <ModalSidebarHeader>
              <ModalSidebarTitle>Authors</ModalSidebarTitle>
            </ModalSidebarHeader>
            <SidebarContent>
              <AddAuthorButton
                data-cy="add-author-button"
                onClick={handleAddAuthor}
              >
                <AddIcon width={40} height={40} />
                <ActionTitle>Add Author</ActionTitle>
              </AddAuthorButton>
              <AuthorList
                author={selection}
                authors={authors}
                onSelect={handleSelect}
                moveAuthor={handleMoveAuthor}
              />
            </SidebarContent>
          </ModalSidebar>
          <ScrollableModalContent data-cy="author-modal-content">
            {selection ? (
              <AuthorForms>
                <SaveAuthorConfirmationDialog
                  isOpen={showConfirmationDialog}
                  onSave={() => handleSaveAuthor(valuesRef.current)}
                  onCancel={handleResetAuthor}
                />
                <AuthorActions
                  author={selection}
                  onSave={() => handleSaveAuthor(valuesRef.current)}
                  onDelete={handleDeleteAuthor}
                  onCancel={() => setOpen(false)}
                />
                <FormLabel>Details</FormLabel>
                <AuthorDetailsForm
                  values={normalize(selection)}
                  onChange={handleChangeAuthor}
                  onSave={handleSaveAuthor}
                  actionsRef={actionsRef}
                />
                <FormLabel>Affiliations</FormLabel>
                <AuthorAffiliations
                  author={selection}
                  affiliations={affiliations}
                  onSave={handleSaveAffiliation}
                  onAdd={handleAddAffiliation}
                  onRemove={handleRemoveAffiliation}
                />
              </AuthorForms>
            ) : (
              <AuthorFormPlaceholder />
            )}
          </ScrollableModalContent>
        </ModalBody>
      </ModalContainer>
    </StyledModal>
  )
}
