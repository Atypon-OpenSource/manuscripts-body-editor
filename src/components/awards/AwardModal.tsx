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
  ModalTitle,
  StyledModal,
} from '@manuscripts/style-guide'
import React, { useRef, useState } from 'react'
import { schema } from '@manuscripts/transform'
import { EditorView } from 'prosemirror-view'

import ReactSubView from '../../views/ReactSubView'
import { AwardAttrs } from '../../views/award'
import { getEditorProps } from '../../plugins/editor-props'
import { AwardForm } from './AwardForm'
import { insertAward } from '../../commands'

const normalizeData = (award: AwardAttrs) => ({
  id: award.id || '',
  source: award.source || '',
  code: award.code || '',
  recipient: award.recipient || '',
})

export interface AwardFormData {
  id: string
  recipient: string
  code: string
  source: string
}

export interface AwardModalProps {
  initialData: AwardAttrs
  onSaveAward: (data: AwardFormData) => void
}

export const AwardModal: React.FC<AwardModalProps> = ({
  initialData,
  onSaveAward,
}) => {
  const [isOpen, setOpen] = useState(true)
  const valuesRef = useRef<AwardAttrs>(undefined)

  const handleSave = () => {
    const updatedValues = valuesRef.current
    if (updatedValues) {
      onSaveAward(updatedValues)
      handleClose()
    }
  }
  const handleClose = () => setOpen(false)
  const handleChange = (values: AwardAttrs) => (valuesRef.current = values)

  const normalizedValues = React.useMemo(
    () => normalizeData(initialData),
    [initialData]
  )

  return (
    <StyledModal
      isOpen={isOpen}
      onRequestClose={handleClose}
      shouldCloseOnOverlayClick={true}
    >
      <ModalContainer data-cy="award-modal">
        <ModalHeader>
          <CloseButton onClick={handleClose} data-cy="modal-close-button" />
        </ModalHeader>
        <ModalCardBody width={480}>
          <ModalTitle>Add Funder information</ModalTitle>
          <AwardForm
            values={normalizedValues}
            onSave={handleSave}
            onCancel={handleClose}
            onChange={handleChange}
          />
        </ModalCardBody>
      </ModalContainer>
    </StyledModal>
  )
}

export const openInsertAwardModal = (view?: EditorView) => {
  if (!view) {
    return
  }

  const { state, dispatch } = view
  const props = getEditorProps(state)
  const onSaveAward = (attrs: AwardAttrs) => {
    insertAward(attrs)(state, dispatch, view)
  }
  const initialData = schema.nodes.award.create().attrs
  const dialog = ReactSubView(
    props,
    AwardModal,
    { initialData, onSaveAward },
    state.doc,
    () => 0,
    view
  )

  document.body.appendChild(dialog)
}
