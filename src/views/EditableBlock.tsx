/*!
 * © 2021 Atypon Systems LLC
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
import React, { SyntheticEvent } from 'react'
import styled from 'styled-components'

import { ContextMenu } from '../lib/context-menu'
import { viewProps } from '../lib/utils'

export const Menus: React.FC<{
  openAddMenu: (e: SyntheticEvent) => void
  openEditMenu: (e: SyntheticEvent) => void
}> = ({ openAddMenu, openEditMenu }) => {
  return (
    <>
      <MenuButton
        href="#"
        onClick={openAddMenu}
        className="add-block add-block-after"
        aria-label="Open menu"
        data-balloon-pos="down-left"
      ></MenuButton>
      <MenuButton
        href="#"
        onClick={openEditMenu}
        className="edit-block"
        aria-label="Open menu"
        data-balloon-pos="down-left"
      ></MenuButton>
    </>
  )
}

export const openMenu = (viewProps: viewProps, edit = false) => (
  e: SyntheticEvent
) => {
  e.preventDefault()
  e.stopPropagation()
  const menu = new ContextMenu(viewProps.node, viewProps.view, viewProps.getPos)
  if (edit) {
    menu.showEditMenu(e.currentTarget)
  } else {
    menu.showAddMenu(e.currentTarget, true)
  }
}

interface EditableBlockProps {
  canWrite: boolean
  viewProps: viewProps
}

const EditableBlock: React.FC<EditableBlockProps> = ({
  children,
  canWrite,
  viewProps,
}) => {
  return (
    <div className="block-container">
      <div className="block-gutter" contentEditable={false}>
        {canWrite && (
          <Menus
            openAddMenu={openMenu(viewProps)}
            openEditMenu={openMenu(viewProps, true)}
          />
        )}
      </div>
      <div className="block">{children}</div>
      <div className="block-gutter" contentEditable={false}></div>
    </div>
  )
}

export default EditableBlock

export const MenuButton = styled.a`
  position: relative;
`
