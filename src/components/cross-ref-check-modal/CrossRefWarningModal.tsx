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
  AttentionOrangeIcon,
  CloseButton,
  ModalContainer,
  ModalHeader,
  PrimaryButton,
  StyledModalContent,
  TertiaryButton,
  TextButton,
} from '@manuscripts/style-guide'
import { ResolvedPos } from 'prosemirror-model'
import { startCase } from 'lodash'
import styled from 'styled-components'

export type XrefGroup = {
  referenced: ManuscriptNode
  label: string
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
          <CloseButton
            onClick={() => handleClose()}
            data-cy="modal-close-button"
          />
        </ModalHeader>
        <Body>
          <Title>
            <AttentionOrangeIcon width={24} height={22} /> Delete referenced
            content?
          </Title>
          <p>You are deleting content referenced elsewhere in the document:</p>
          <ScrolableItems>
            {xrefs.map((group, i) => (
              <XrefGroupDisplay
                key={i}
                group={group}
                selectAndScrollTo={selectAndScrollTo}
              />
            ))}
          </ScrolableItems>
          <Actions>
            <TertiaryButton type="button" onClick={() => handleClose()}>
              Cancel
            </TertiaryButton>
            <PrimaryButton
              $danger={true}
              type="button"
              onClick={() => {
                onConfirm()
                setIsOpen(false)
              }}
            >
              Delete & remove citation
            </PrimaryButton>
          </Actions>
        </Body>
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
      <h3>{group.label}</h3>
      <ReferencesList>
        {group.xrefs.map(([, pos], i) => {
          return (
            <li key={i}>
              <TextButton onClick={() => selectAndScrollTo(pos)}>
                {`${startCase(pos.parent.type.name)} - ${pos.parent.textContent}`}
              </TextButton>
            </li>
          )
        })}
      </ReferencesList>
    </div>
  )
}

const Container = styled(ModalContainer)`
  position: absolute;
  top: 1rem;
  left: 50%;
  right: 0;
  max-height: calc(50vh - 2rem);
  min-height: 280px;
  transform: translate(-50%, 0);
  max-width: 480px;
  transition:
    top 0.2s,
    transform 0.2s;
`

// since we need to scroll inside the editor when this dialog is active, we can't use dialog.showModal()
// so we recreate the appearance using classic position:fixed/after approach.
// While showModal doesn't block scrolling - it doesn't allow to focus on the editor and that kills the scrollIntoView
const Modal = styled(StyledModalContent)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1100;
  color: #6e6e6e;
  margin: auto;

  &.modal-bottom ${Container} {
    top: calc(100% - 2rem);
    transform: translate(-50%, -100%);
  }

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
  h3 {
    font-size: 16px;
    margin: 0.5em 0;
  }
  p {
    margin: 0.5em 0;
  }
`

const Body = styled.div`
  margin: 1.5rem;
  display: flex;
  flex-flow: column;
`

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
  margin: 0;
  color: #353535;
  svg {
    vertical-align: text-top;
  }
`

const ReferencesList = styled.ul`
  padding: 8px;
  margin-left: 0;
  list-style: none;
  background: #f2f2f2;
  border: 1px solid #e2e2e2;
  border-radius: 3px;

  ${TextButton} {
    margin-left: 0;
    text-decoration: underline;
    &:hover {
      text-decoration: none;
    }
    display: block;
    max-width: 100%;
    overflow: hidden;
    color: #353535;
    text-overflow: ellipsis;
  }
`

const Actions = styled.footer`
  text-align: right;
  padding-top: 1rem;
`
const ScrolableItems = styled.div`
  max-height: 16vh;
  min-height: 100px;
  overflow-y: auto;
`
