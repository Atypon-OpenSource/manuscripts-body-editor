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
  CloseButton,
  ModalContainer,
  ModalHeader,
  StyledModal,
} from '@manuscripts/style-guide'
import { generateNodeID, schema } from '@manuscripts/transform'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { AffiliationAttrs, ContributorAttrs } from '../../lib/authors'
import { normalizeAuthor } from '../../lib/normalize'
import {
  MODAL_ON_CLOSE_NOTIFY_DELAY_MS,
  FormTitle,
  StyledModalBody,
  StyledScrollableModalContent,
} from '../form/CreateModalStyles'
import FormFooter from '../form/FormFooter'
import { ModalFormSaveButton } from '../form/ModalFormActions'
import { AuthorDetailsForm, FormActions } from './AuthorDetailsForm'
import { useManageAffiliations } from './useManageAffiliations'
import { useManageCredit } from './useManageCredit'

export interface CreateAuthorModalProps {
  authorsCount: number
  affiliations: AffiliationAttrs[]
  onSave: (author: ContributorAttrs) => void
  onClose: () => void
}

export const CreateAuthorModal: React.FC<CreateAuthorModalProps> = ({
  authorsCount,
  affiliations: $affiliations,
  onSave,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(true)
  const [isDisableSave, setDisableSave] = useState(true)
  const [isEmailRequired, setEmailRequired] = useState(false)
  const [hasError, setHasError] = useState(false)
  const actionsRef = useRef<FormActions>(undefined)
  const authorFormRef = useRef<HTMLFormElement>(null)

  const selection = useMemo(
    () => createEmptyAuthor(authorsCount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Wait for the close animation to finish before calling onClose.
  const prevIsOpenRef = useRef(true)
  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) {
      prevIsOpenRef.current = isOpen
      const id = window.setTimeout(() => {
        onClose()
      }, MODAL_ON_CLOSE_NOTIFY_DELAY_MS)
      return () => window.clearTimeout(id)
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, onClose])

  const { selectedAffiliations } = useManageAffiliations(
    selection,
    $affiliations
  )

  const { selectedCreditRoles } = useManageCredit(selection)

  const handleSave = (values: ContributorAttrs) => {
    onSave({ ...selection, ...values })
    setIsOpen(false)
  }

  const handleChange = (values: ContributorAttrs) => {
    const { given, family, email, isCorresponding } = values
    const isNameFilled = given?.length || family?.length

    if (isNameFilled) {
      if (isCorresponding) {
        setDisableSave(!email?.length)
      } else {
        setDisableSave(false)
      }
    } else {
      setDisableSave(true)
    }

    setEmailRequired(!!isCorresponding)
  }

  return (
    <StyledModal
      isOpen={isOpen}
      onRequestClose={() => setIsOpen(false)}
      shouldCloseOnOverlayClick={true}
    >
      <ModalContainer data-cy="create-author-modal">
        <ModalHeader>
          <CloseButton
            onClick={() => setIsOpen(false)}
            data-cy="modal-close-button"
          />
        </ModalHeader>
        <StyledModalBody>
          <StyledScrollableModalContent>
            <FormTitle>Create New Author</FormTitle>
            <AuthorDetailsForm
              values={normalizeAuthor(selection)}
              onChange={handleChange}
              onSave={handleSave}
              actionsRef={actionsRef}
              isEmailRequired={isEmailRequired}
              selectedAffiliations={selectedAffiliations.map((a) => a.id)}
              authorFormRef={authorFormRef}
              selectedCreditRoles={selectedCreditRoles}
              newEntity={true}
              onAuthorDetailsTabErrorChange={setHasError}
            />
          </StyledScrollableModalContent>
        </StyledModalBody>
        <FormFooter
          onCancel={() => setIsOpen(false)}
          primaryAction={
            <ModalFormSaveButton
              form="author-details-form"
              newEntity={true}
              isDisableSave={isDisableSave || hasError}
              createLabel="Create New Author"
              onSubmitForm={() => actionsRef.current?.submitForm?.()}
            />
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
