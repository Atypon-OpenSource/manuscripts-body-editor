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

import { AffiliationAttrs } from '../../lib/authors'
import { checkID } from '../../lib/normalize'
import {
  MODAL_ON_CLOSE_NOTIFY_DELAY_MS,
  FormTitle,
  StyledModalBody,
  StyledScrollableModalContent,
} from '../form/CreateModalStyles'
import FormFooter from '../form/FormFooter'
import { ModalFormSaveButton } from '../form/ModalFormActions'
import { AffiliationForm, FormActions } from './AffiliationForm'

export interface CreateAffiliationModalProps {
  affiliationsCount: number
  onSave: (affiliation: AffiliationAttrs) => void
  onClose: () => void
}

export const CreateAffiliationModal: React.FC<CreateAffiliationModalProps> = ({
  affiliationsCount,
  onSave,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isDisableSave, setIsDisableSave] = useState(true)
  const actionsRef = useRef<FormActions>(undefined)

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

  const selection = useMemo(
    () => ({
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
      email: { href: '', text: '' },
      priority: affiliationsCount,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleSave = (values: AffiliationAttrs) => {
    onSave({ ...checkID(selection, 'affiliation'), ...values })
    setIsOpen(false)
  }

  const handleChange = (values: AffiliationAttrs) => {
    const isInstitutionEmpty = !values.institution?.trim()
    setIsDisableSave(isInstitutionEmpty)
  }

  return (
    <StyledModal
      isOpen={isOpen}
      onRequestClose={() => setIsOpen(false)}
      shouldCloseOnOverlayClick={true}
    >
      <ModalContainer data-cy="create-affiliation-modal">
        <ModalHeader>
          <CloseButton
            onClick={() => setIsOpen(false)}
            data-cy="modal-close-button"
          />
        </ModalHeader>
        <StyledModalBody>
          <StyledScrollableModalContent>
            <FormTitle>Create New Affiliation</FormTitle>
            <AffiliationForm
              values={checkID(selection, 'affiliation')}
              onSave={handleSave}
              onChange={handleChange}
              actionsRef={actionsRef}
              newEntity={true}
              onAffiliationErrorChange={setHasError}
            />
          </StyledScrollableModalContent>
        </StyledModalBody>
        <FormFooter
          onCancel={() => setIsOpen(false)}
          primaryAction={
            <ModalFormSaveButton
              form="affiliation-form"
              newEntity={true}
              isDisableSave={isDisableSave || hasError}
              createLabel="Create New Affiliation"
              onSubmitForm={() => actionsRef.current?.submitForm?.()}
            />
          }
        />
      </ModalContainer>
    </StyledModal>
  )
}
