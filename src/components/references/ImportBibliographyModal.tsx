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
  ModalCardBody,
  ModalContainer,
  ModalHeader,
  StyledModalContent,
} from '@manuscripts/style-guide'
import { BibliographyItemAttrs } from '@manuscripts/transform'
import React, { useState } from 'react'

import { ImportBibliography } from './ImportBibliography'
import { ImportReferencesConfirmation } from './ImportReferencesConfirmation'

export interface ImportBibliographyModalProps {
  onCancel: () => void
  onSave: (data: BibliographyItemAttrs[]) => void
}

export const ImportBibliographyModal: React.FC<
  ImportBibliographyModalProps
> = ({ onCancel, onSave }) => {
  const [isOpen, setOpen] = useState(true)
  const [pendingItems, setPendingItems] = useState<
    BibliographyItemAttrs[] | null
  >(null)

  const isConfirming = pendingItems !== null
  const handleClose = () => setOpen(false)
  const handleBack = () => setPendingItems(null)

  const handleConfirm = (items: BibliographyItemAttrs[]) => {
    onSave(items)
    handleClose()
  }

  return (
    <StyledModalContent isOpen={isOpen} onRequestClose={onCancel}>
      <ModalContainer
        data-cy={
          isConfirming
            ? 'import-confirmation-modal'
            : 'import-bibliography-modal'
        }
      >
        <ModalHeader>
          <CloseButton
            onClick={isConfirming ? handleBack : onCancel}
            data-cy="modal-close-button"
          />
        </ModalHeader>
        <ModalCardBody $width={724}>
          {pendingItems ? (
            <ImportReferencesConfirmation
              items={pendingItems}
              onCancel={handleBack}
              onConfirm={handleConfirm}
            />
          ) : (
            <ImportBibliography
              onCancel={onCancel}
              onContinue={setPendingItems}
            />
          )}
        </ModalCardBody>
      </ModalContainer>
    </StyledModalContent>
  )
}
