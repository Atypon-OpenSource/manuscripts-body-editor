/*!
 * © 2026 Atypon Systems LLC
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

import { ManuscriptNode } from '@manuscripts/transform'
import React, { useState } from 'react'

import { CloseButton, ModalContainer, ModalHeader, StyledModal } from '@manuscripts/style-guide'
import { StyledModalBody } from '../form/CreateModalStyles'

export type XrefGroup = {
  referenced: ManuscriptNode,
  xrefs: [ManuscriptNode, number][]
}

export const CrossRefWarningModal: React.FC<{
  onClose: () => void,
  xrefs: XrefGroup[],
  onConfirm: () => void
}> = ({ onClose, xrefs }) => {

  const [isOpen, setIsOpen] = useState(true)
  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }
  
  return (
    <StyledModal
      isOpen={isOpen}
      onRequestClose={() => handleClose()}
      shouldCloseOnOverlayClick={false}
    >
      <ModalContainer data-cy="cross-reference-warning-modal">
        <ModalHeader>
          Achtung! Achtung! Element is referenced! 
          <CloseButton
            onClick={() => handleClose()}
            data-cy="modal-close-button"
          />
        </ModalHeader>
        <StyledModalBody></StyledModalBody>
      </ModalContainer>
    </StyledModal>
  )
}