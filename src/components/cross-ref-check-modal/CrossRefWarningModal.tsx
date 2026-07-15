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
import { ResolvedPos } from 'prosemirror-model'
import { startCase, truncate } from 'lodash'

export type XrefGroup = {
  referenced: ManuscriptNode,
  xrefs: [ManuscriptNode, ResolvedPos][]
}

export const CrossRefWarningModal: React.FC<{
  onClose: () => void,
  xrefs: XrefGroup[],
  onConfirm: () => void,
  selectAndScrollTo: (node: ManuscriptNode) => void
}> = ({ onClose, xrefs, onConfirm, selectAndScrollTo }) => {

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
          Delete referenced content?
          <CloseButton
            onClick={() => handleClose()}
            data-cy="modal-close-button"
          />
        </ModalHeader>
        <StyledModalBody>
          <p>
            You are deleting content referenced elsewhere in the document:
          </p>
          {
            xrefs.map((group, i) => <XrefGroupDisplay key={i} group={group} selectAndScrollTo={selectAndScrollTo} />)
          }
          <div>
            <button type='button' onClick={() => handleClose()}>Cancel</button>
            <button type='button' onClick={() => onConfirm()}>Delete & remove citation</button>
          </div>
        </StyledModalBody>
      </ModalContainer>
    </StyledModal>
  )
}

const XrefGroupDisplay: React.FC<{group: XrefGroup, selectAndScrollTo: (node: ManuscriptNode) => void }> = ({ group, selectAndScrollTo }) => {
  return <div>
    <h3>{startCase(group.referenced.type.name)}</h3>
    <ul>
      {group.xrefs.map(([node, pos], i) => {
        return (
          <li key={i}>
              <button onClick={() => selectAndScrollTo(node)}>
                {`${startCase(pos.parent.type.name)} - ${truncate(pos.parent.textContent, { length: 20 })}`}
              </button>
          </li>)
      })}
    </ul>
  </div>
}