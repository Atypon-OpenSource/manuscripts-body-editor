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
  ArrowUpIcon,
  AttentionRedIcon,
  ButtonGroup,
  IconButton,
  ModalContainer,
  PrimaryButton,
  RadioButton,
  StyledModal,
  TertiaryButton,
  withFocusTrap,
} from '@manuscripts/style-guide'
import { ResolvedPos } from 'prosemirror-model'
import { findChildren } from 'prosemirror-utils'
import styled from 'styled-components'

export type XrefGroup = {
  referenced: ManuscriptNode
  label: string
  xrefs: [ManuscriptNode, ResolvedPos][]
}

export type DeleteOption = 'delete-without-ref' | 'delete-with-ref'

export const CrossRefWarningModal: React.FC<{
  onClose: () => void
  xrefs: XrefGroup[]
  onConfirm: (deleteOption: DeleteOption) => void
  selectAndScrollTo: ($pos: ResolvedPos) => void
}> = ({ onClose, xrefs, onConfirm, selectAndScrollTo }) => {
  const [isOpen, setIsOpen] = useState(true)
  const [deleteOption, setDeleteOption] =
    useState<DeleteOption>('delete-without-ref')

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  const [showRef, setShowRef] = useState(true)

  const toggleReferenceList = () => setShowRef(!showRef)

  const onChangeDeleteOption = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setDeleteOption(value as DeleteOption)
  }

  const references = xrefs.flatMap((xrefGroup) =>
    xrefGroup.xrefs.map((xref) => [...xref, xrefGroup.label])
  ) as [ManuscriptNode, ResolvedPos, string][]

  const elementLabel =
    xrefs.length === 1 ? xrefs[0].label : `${xrefs.length} elements`
  const locationWord = references.length === 1 ? 'location' : 'locations'
  const pronoun = xrefs.length === 1 ? 'it' : 'them'

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => handleClose()}
      shouldCloseOnOverlayClick={false}
      hideOverlay={true}
    >
      <Container data-cy="cross-reference-warning-modal">
        <Body>
          <Title>
            <AttentionRedIcon width={24} height={24} />
            Confirm deletion?
          </Title>
          <p>
            <b>{elementLabel}</b> {xrefs.length === 1 ? 'is' : 'are'} actively
            referenced in{' '}
            <b>
              {references.length} {locationWord}
            </b>{' '}
            in your document. Deleting {pronoun} will break the following
            cross-references:
          </p>
          {/*<XrefGroupDisplay*/}
          {/*  references={references}*/}
          {/*  selectAndScrollTo={selectAndScrollTo}*/}
          {/*/>*/}
          <div>
            <ToggleHeader>
              <SecondaryBoldHeading>Hide locations</SecondaryBoldHeading>
              <ToggleButton onClick={toggleReferenceList}>
                <ArrowUpIcon />
              </ToggleButton>
            </ToggleHeader>
            {showRef && (
              <ListWrapper>
                {xrefs.map((group, i) => (
                  <XrefGroupDisplay
                    key={i}
                    group={group}
                    selectAndScrollTo={selectAndScrollTo}
                  />
                ))}
              </ListWrapper>
            )}
          </div>
          <SelectorContainer>
            <RadioButton
              name={'delete-option'}
              id={'delete-without-ref-option'}
              value={'delete-without-ref'}
              label={'Delete but keep referenced text'}
              checked={deleteOption === 'delete-without-ref'}
              onChange={onChangeDeleteOption}
            />
            <RadioButton
              name={'delete-option'}
              id={'delete-with-ref-option'}
              value={'delete-with-ref'}
              label={'Delete & remove references'}
              checked={deleteOption === 'delete-with-ref'}
              onChange={onChangeDeleteOption}
            />
          </SelectorContainer>
          <ButtonGroup>
            <TertiaryButton type="button" onClick={() => handleClose()}>
              Cancel
            </TertiaryButton>
            <PrimaryButton
              $danger={true}
              type="button"
              onClick={() => {
                onConfirm(deleteOption)
                setIsOpen(false)
              }}
            >
              Delete
            </PrimaryButton>
          </ButtonGroup>
        </Body>
      </Container>
    </Modal>
  )
}

const XrefGroupDisplay: React.FC<{
  group: XrefGroup
  selectAndScrollTo: ($pos: ResolvedPos) => void
}> = ({ group, selectAndScrollTo }) => {
  const [showRef, setShowRef] = useState(true)

  const toggleReferenceList = () => setShowRef(!showRef)

  return (
    <NestedListWrapper>
      <SecondaryToggleHeader>
        <SecondaryHeading>{group.label}</SecondaryHeading>
        <ToggleButton onClick={toggleReferenceList}>
          <ArrowUpIcon />
        </ToggleButton>
      </SecondaryToggleHeader>
      {showRef && (
        <ReferencesList>
          {group.xrefs.map(([xrefNode, pos], i) => {
            const xrefPos = findChildren(
              pos.node(),
              (child) => child.attrs.id === xrefNode.attrs.id
            )[0]

            const content = pos.node().content
            const MAX_LENGTH = 40

            const nodeStart = xrefPos.pos
            const nodeEnd = xrefPos.pos + xrefNode.nodeSize

            const leftHandText = content.textBetween(
              nodeStart > MAX_LENGTH ? nodeStart - MAX_LENGTH : 0,
              nodeStart
            )
            const rightHandText = content.textBetween(
              nodeEnd,
              Math.min(nodeEnd + MAX_LENGTH, content.size)
            )

            const derivedLabel =
              xrefNode.attrs.label || group.label || '[cross-ref]'

            return (
              <ListItem key={i}>
                <XRefTextContainer>
                  <XRefAdjacentText direction={'rtl'}>
                    {leftHandText}
                  </XRefAdjacentText>
                  <XRefLabel>{derivedLabel}</XRefLabel>
                  <XRefAdjacentText direction={'ltr'}>
                    {rightHandText}
                  </XRefAdjacentText>
                </XRefTextContainer>
                <ScrollButton
                  $mini={true}
                  onClick={() => selectAndScrollTo(pos)}
                >
                  Show
                </ScrollButton>
              </ListItem>
            )
          })}
        </ReferencesList>
      )}
    </NestedListWrapper>
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
  max-width: 556px;
  transition:
    top 0.2s,
    transform 0.2s;
`

// since we need to scroll inside the editor when this dialog is active, we can't use dialog.showModal()
// so we recreate the appearance using classic position:fixed/after approach.
// While showModal doesn't block scrolling - it doesn't allow to focus on the editor and that kills the scrollIntoView
const Modal = styled(StyledModal)`
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

const Body = withFocusTrap(styled.div`
  margin: 1.5rem;
  display: flex;
  flex-flow: column;
`)

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
  margin: 0;
  color: #353535;
  svg {
    vertical-align: text-top;
    margin-right: 8px;
  }
`

const ToggleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 3px 6px 8px;
  border-radius: 4px 4px 0 0;
  border: 1px solid #e2e2e2;
  background: #f2f2f2;
`

const ListWrapper = styled.div`
  border: 1px solid #e2e2e2;
  border-top: none;
  max-height: 16vh;
  min-height: 100px;
  overflow-y: auto;
`

const NestedListWrapper = styled.div`
  padding: 2px 10px;
`

const SecondaryToggleHeader = styled(ToggleHeader)`
  padding: 0;
  border: none;
  background: #ffffff;
  border-bottom: 1px solid #e2e2e2;
`

const ToggleButton = styled(IconButton)`
  height: 24px;
  &&:not([disabled]):focus-visible {
    outline: 2px solid ${(props) => props.theme.colors.outline.focus};
    outline-offset: 2px;
  }
  svg {
    width: 12px;
    height: 7px;
  }
`

const SecondaryHeading = styled.div`
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  line-height: 24px;
  color: #6e6e6e;
  user-select: none;
`

const SecondaryBoldHeading = styled(SecondaryHeading)`
  font-weight: 700;
  color: #6e6e6e;
`

const ReferencesList = styled.ul`
  display: flex;
  gap: 10px;
  flex-direction: column;
  padding: 12px;
  margin: 0;
  list-style: none;
`

const ListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: solid 1px #e2e2e2;
  &:last-child {
    border-bottom: none;
    padding: 0;
  }
`

const ScrollButton = styled(TertiaryButton)`
  margin: 0;
  padding: 4px;
  font-size: 14px;
  line-height: 24px;
  text-decoration-line: underline;
`

const XRefTextContainer = styled.div`
  display: flex;
  color: #6e6e6e;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 16px;
`

const XRefLabel = styled.span`
  border-radius: 4px;
  border: 1px solid #fe8f1f;
  background: #fff9e5;
  mix-blend-mode: darken;
`

const XRefAdjacentText = styled.span<{ direction: 'rtl' | 'ltr' }>`
  display: block;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: ${(props) => props.direction};
`

const SelectorContainer = styled.div`
  display: flex;
  gap: 24px;
  padding: 8px 12px 4px 12px;
  margin: 24px 0;
  border-radius: 4px;
  border: 1px solid #fe8f1f;
  background: #fff9e5;
`
