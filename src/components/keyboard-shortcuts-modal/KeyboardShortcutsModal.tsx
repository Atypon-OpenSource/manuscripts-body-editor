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
  ButtonGroup,
  CloseButton,
  InspectorTabPanel,
  InspectorTabPanels,
  InspectorTabs,
  ModalBody,
  ModalContainer,
  ModalHeader,
  ModalSidebar,
  ModalSidebarHeader,
  ModalSidebarTitle,
  PrimaryButton,
  SidebarContent,
  StyledModal,
  useFocusCycle,
} from '@manuscripts/style-guide'
import { EditorView } from 'prosemirror-view'
import React, { useRef, useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'

import type { EditorProps } from '../../configs/ManuscriptsEditor'
import { isMac } from '../../lib/platform'
import { getEditorProps } from '../../plugins/editor-props'
import { createSubViewAsync } from '../../views/ReactSubView'
import { ModalTabs } from '../authors-affiliations/ModalTabs'
import { formattedShortCut } from './FormattedShortcut'
import { EDITOR_KEYBOARD_SHORTCUT_TABS } from './keyboard-shortcuts'

const TAB_LABELS = EDITOR_KEYBOARD_SHORTCUT_TABS.map((t) => t.label)
const KEYBOARD_SHORTCUTS_MODAL_TITLE_ID = 'keyboard-shortcuts-modal-title'
export const KEYBOARD_SHORTCUTS_MODAL_ID = 'keyboard-shortcuts-modal'

export type KeyboardShortcutsModalProps = {
  editorProps: EditorProps
  isOpen: boolean
  onClose: () => void
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  editorProps,
  isOpen,
  onClose,
}) => {
  const [tabIndex, setTabIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useFocusCycle(containerRef, isOpen)

  return (
    <ThemeProvider theme={editorProps.theme}>
      <StyledModal
        isOpen={isOpen}
        onRequestClose={onClose}
        shouldCloseOnOverlayClick={true}
        ariaLabelledby={KEYBOARD_SHORTCUTS_MODAL_TITLE_ID}
        id={KEYBOARD_SHORTCUTS_MODAL_ID}
      >
        <ModalContainer ref={containerRef}>
          <ModalHeader>
            <CloseButton onClick={onClose} data-cy="modal-close-button" />
          </ModalHeader>
          <StyledModalBody>
            <StyledModalSidebar>
              <StyledModalSidebarHeader>
                <StyledModalSidebarTitle
                  as="h2"
                  id={KEYBOARD_SHORTCUTS_MODAL_TITLE_ID}
                >
                  Keyboard shortcuts
                </StyledModalSidebarTitle>
              </StyledModalSidebarHeader>
              <StyledSidebarContent>
                <ShortcutTabs selectedIndex={tabIndex} onChange={setTabIndex}>
                  <ModalTabsWrapper>
                    <ModalTabs tabLabels={TAB_LABELS} />
                  </ModalTabsWrapper>

                  <InspectorTabPanels>
                    {EDITOR_KEYBOARD_SHORTCUT_TABS.map((tab) => (
                      <ShortcutTabPanel key={tab.id}>
                        {tab.sections.map((section, sectionIndex) => (
                          <Section key={`${tab.id}:${sectionIndex}`}>
                            <SectionTitle>{section.title}</SectionTitle>
                            <ShortcutTable>
                              {section.rows.map((row, rowIndex) => (
                                <ShortcutRow
                                  key={`${tab.id}-${sectionIndex}-${rowIndex}`}
                                >
                                  <ShortcutLabel>{row.label}</ShortcutLabel>
                                  <ShortcutKeys>
                                    {formattedShortCut(
                                      isMac ? row.shortcut.mac : row.shortcut.pc
                                    )}
                                  </ShortcutKeys>
                                </ShortcutRow>
                              ))}
                            </ShortcutTable>
                          </Section>
                        ))}
                      </ShortcutTabPanel>
                    ))}
                  </InspectorTabPanels>
                </ShortcutTabs>
              </StyledSidebarContent>
              <ButtonsContainer>
                <PrimaryButton onClick={onClose}>Close</PrimaryButton>
              </ButtonsContainer>
            </StyledModalSidebar>
          </StyledModalBody>
        </ModalContainer>
      </StyledModal>
    </ThemeProvider>
  )
}

const ShortcutTabs = styled(InspectorTabs)`
  display: flex;
  flex-direction: column;
  min-height: 0;
`

const ModalTabsWrapper = styled('div')`
  margin: 0 ${(props) => props.theme.grid.unit * 8}px
    ${(props) => props.theme.grid.unit * 3}px;
`

const ShortcutTabPanel = styled(InspectorTabPanel).attrs({
  tabIndex: -1,
  unmount: false,
})`
  margin-top: ${(props) => props.theme.grid.unit * 3}px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`

const StyledModalSidebar = styled(ModalSidebar)`
  position: relative;
  background: white;
  max-width: none;
  width: min(664px, 90vw);
  display: flex;
  flex-direction: column;
  padding: 0;
`

const StyledModalSidebarHeader = styled(ModalSidebarHeader)`
  margin: 0 ${(props) => props.theme.grid.unit * 8}px;
  padding: 0;
`

const StyledModalSidebarTitle = styled(ModalSidebarTitle)`
  margin: ${(props) => props.theme.grid.unit * 6}px 0;
  padding: 0;
`

const StyledModalBody = styled(ModalBody)`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`

const StyledSidebarContent = styled(SidebarContent)`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  gap: ${(props) => props.theme.grid.unit * 2}px;
  padding: 0;
`

const Section = styled.section`
  margin: 0 0 ${(props) => props.theme.grid.unit * 4}px;

  &:last-child {
    margin-bottom: 0;
  }
`

const SectionTitle = styled.h3`
  margin: 0 ${(props) => props.theme.grid.unit * 8}px
    ${(props) => props.theme.grid.unit * 2}px;
  font-size: ${(props) => props.theme.font.size.large};
  font-weight: ${(props) => props.theme.font.weight.normal};
  line-height: ${(props) => props.theme.font.lineHeight.large};
  color: ${(props) => props.theme.colors.text.greyMuted};
`

const ShortcutTable = styled.div`
  border-collapse: collapse;
  font-size: ${(props) => props.theme.font.size.normal};
  margin: 0 ${(props) => props.theme.grid.unit * 8}px;
`
const ShortcutRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.grid.unit * 1.5}px 0;
`
const ShortcutLabel = styled.div`
  padding: ${(props) => props.theme.grid.unit * 1.5}px
    ${(props) => props.theme.grid.unit * 2}px
    ${(props) => props.theme.grid.unit * 1.5}px 0;
  vertical-align: top;
  color: ${(props) => props.theme.colors.text.secondary};
`

const ShortcutKeys = styled.div`
  padding: ${(props) => props.theme.grid.unit * 1.5}px 0;
  vertical-align: top;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`

const ButtonsContainer = styled(ButtonGroup)`
  padding: ${(props) => props.theme.grid.unit * 4}px 0;
  margin: 0 ${(props) => props.theme.grid.unit * 8}px;
  flex-shrink: 0;
`

let dialog: HTMLDivElement | null = null

export async function openKeyboardShortcuts(view?: EditorView): Promise<void> {
  if (!view || dialog) {
    return
  }

  const { state } = view
  const editorProps = getEditorProps(state)

  const cleanup = () => {
    if (dialog) {
      dialog.remove()
      dialog = null
    }
    // modals are rendered outside tools-panel (dialog) because of react-modal,
    // so we need to remove them manually
    //@TODO The implementation in the body editor is incorrect and needs to be fixed.
    const modal = document.getElementById(KEYBOARD_SHORTCUTS_MODAL_ID)
    if (modal) {
      modal.remove()
    }
    // Restore editor focus at the existing selection after the dialog is torn down.
    requestAnimationFrame(() => {
      view.focus()
    })
  }

  dialog = await createSubViewAsync(
    editorProps,
    KeyboardShortcutsModal,
    {
      editorProps,
      isOpen: true,
      onClose: cleanup,
    },
    state.doc,
    () => -1,
    view
  )

  document.body.appendChild(dialog)
}
