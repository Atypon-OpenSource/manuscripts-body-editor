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

import {
  CloseButton,
  ModalContainer,
  ModalHeader,
  StyledModal,
} from '@manuscripts/style-guide'
import { StyledModalBody } from '../form/CreateModalStyles'
import { ResolvedPos } from 'prosemirror-model'
import { startCase, truncate } from 'lodash'
import styled from 'styled-components'

export type XrefGroup = {
  referenced: ManuscriptNode
  xrefs: [ManuscriptNode, ResolvedPos][]
}

export const CrossRefWarningModal: React.FC<{
  onClose: () => void
  xrefs: XrefGroup[]
  onConfirm: () => void
  selectAndScrollTo: ($pos: ResolvedPos) => void
}> = ({ onClose, xrefs, onConfirm, selectAndScrollTo }) => {
  const [isOpen, setIsOpen] = useState(true)
  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => handleClose()}
      shouldCloseOnOverlayClick={false}
      hideOverlay={true}
    >
      <Container data-cy="cross-reference-warning-modal">
        <ModalHeader>
          Delete referenced content?
          <CloseButton
            onClick={() => handleClose()}
            data-cy="modal-close-button"
          />
        </ModalHeader>
        <StyledModalBody>
          <p>You are deleting content referenced elsewhere in the document:</p>
          {xrefs.map((group, i) => (
            <XrefGroupDisplay
              key={i}
              group={group}
              selectAndScrollTo={selectAndScrollTo}
            />
          ))}
          <div>
            <button type="button" onClick={() => handleClose()}>
              Cancel
            </button>
            <button type="button" onClick={() => onConfirm()}>
              Delete & remove citation
            </button>
          </div>
        </StyledModalBody>
      </Container>
    </Modal>
  )
}

const XrefGroupDisplay: React.FC<{
  group: XrefGroup
  selectAndScrollTo: ($pos: ResolvedPos) => void
}> = ({ group, selectAndScrollTo }) => {
  return (
    <div>
      <h3>{startCase(group.referenced.type.name)}</h3>
      <ul>
        {group.xrefs.map(([, pos], i) => {
          return (
            <li key={i}>
              <button onClick={() => selectAndScrollTo(pos)}>
                {`${startCase(pos.parent.type.name)} - ${truncate(pos.parent.textContent, { length: 20 })}`}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// since we need to scroll inside the editor when this dialog is active, we can't use dialog.showModal()
// so we recreate the appearance using classic position:fixed/after approach.
// While showModal doesn't block scrolling - it doesn't allow to focus on the editor and that kills the scrollIntoView
const Modal = styled(StyledModal)`
  margin-top: 1rem;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1100;

  &:after {
    content: '';
    display: block;
    position: fixed;
    z-index: -1;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
  }
`
const Container = styled(ModalContainer)`
  max-height: calc(50vh - 3rem);
`
