/*!
 * © 2024 Atypon Systems LLC
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
import { DotsIcon, IconButton } from '@manuscripts/style-guide'
import { EditorView } from 'prosemirror-view'
import React from 'react'
import styled from 'styled-components'

export const ContextMenuButton: React.FC<{ toggleOpen: () => void }> = ({
  toggleOpen,
}) => (
  <MenuButton className={'table-context-menu-button'} onClick={toggleOpen}>
    <DotsIcon />
  </MenuButton>
)

export const ContextMenu: React.FC<{ view: EditorView }> = () => {
  return (
    <MenuDropdownList>
      {/*   TODO:: table operations button */}
    </MenuDropdownList>
  )
}

const MenuButton = styled(IconButton)`
  border: 1px solid #c9c9c9 !important;
  border-radius: 4px;
  width: ${(props) => props.theme.grid.unit * 6}px;
  height: ${(props) => props.theme.grid.unit * 6}px;
  background: white;
  position: absolute;
  top: 0;
  right: 0;

  :hover,
  :active,
  :focus {
    background: white !important;
  }
`

const MenuDropdownList = styled.div`
  display: flex;
  flex-direction: column;
`
