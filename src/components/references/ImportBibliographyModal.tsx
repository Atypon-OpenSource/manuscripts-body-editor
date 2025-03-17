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
import { BibliographyItemAttrs } from '@manuscripts/transform'
import React, { useState } from 'react'
import styled from 'styled-components'

import { ImportBibliographyForm } from './ImportBibliographyForm'

export interface ImportBibliographyModalProps {
  onCancel: () => void
  onSave: (data: BibliographyItemAttrs[]) => void
}

export const ImportBibliographyModal: React.FC<
  ImportBibliographyModalProps
> = ({ onCancel, onSave }) => {
  const [isOpen, setOpen] = useState(true)

  const handleCancel = () => {
    handleClose()
  }
  const handleClose = () => setOpen(false)

  const handleSave = (data: BibliographyItemAttrs[]) => {
    const bibliographyItems: BibliographyItemAttrs[] = data
    onSave(bibliographyItems)
    handleClose()
  }

  return (
    <StyledModal isOpen={isOpen} onRequestClose={onCancel}>
      <ModalContainer data-cy="import-bibliography-modal">
        <ModalHeader>
          <CloseButton onClick={onCancel} data-cy="modal-close-button" />
        </ModalHeader>
        <ModalBody>
          <ModalTitle>Import Bibliography</ModalTitle>
          <p>BibTex, PubMed, RIS, ENW and DOI formats are supported</p>
          <ImportBibliographyForm onCancel={handleCancel} onSave={handleSave} />
        </ModalBody>
      </ModalContainer>
    </StyledModal>
  )
}

const ModalBody = styled.div`
  box-sizing: border-box;
  padding: ${(props) => 6 * props.theme.grid.unit}px;
  background-color: ${(props) => props.theme.colors.background.primary};
  width: 640px;
  max-width: 60vw;
  max-height: 80vh;
`
const ModalTitle = styled.h2`
  font-family: ${(props) => props.theme.font.family.sans};
  font-size: ${(props) => props.theme.font.size.medium};
  font-weight: ${(props) => props.theme.font.weight.bold};
  color: ${(props) => props.theme.colors.text.primary};
  margin: 0;
`
