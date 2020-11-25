/*!
 * © 2019 Atypon Systems LLC
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

import React from 'react'
import Modal from 'react-modal'
import styled from 'styled-components'

import { MenuItemContainer, MenuList, Text } from './MenuItemContainer'
import { MenuItem } from './types'

Modal.setAppElement('#root')

const ApplicationMenuContainer = styled.div`
  display: flex;
  font-size: 14px;
`

const MenuHeading = styled.div<{ isOpen: boolean }>`
  padding: 4px 8px;
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom: none;
`

const MenuContainer = styled.div<{ isEnabled: boolean }>`
  position: relative;

  & ${MenuHeading} {
    background-color: #fff;
    color: ${(props) => (props.isEnabled ? '#353535' : '#e2e2e2')};

    &:hover {
      background-color: ${(props) => (props.isEnabled ? '#f2fbfc' : '#fff')};
    }
  }
`

interface Props {
  menuState: MenuItem[]
  wrapperRef: React.Ref<HTMLDivElement>
  handleItemClick: (indices: number[]) => void
}

export const ApplicationMenus: React.FC<Props> = ({
  menuState,
  wrapperRef,
  handleItemClick,
}) => {
  return (
    <ApplicationMenuContainer ref={wrapperRef}>
      {menuState.map((menu, index) => {
        return (
          <MenuContainer key={`menu-${index}`} isEnabled={menu.enable}>
            <MenuHeading
              onMouseDown={(e) => {
                e.preventDefault()
                handleItemClick([index])
              }}
              isOpen={menu.isOpen}
            >
              <Text>{menu.label}</Text>
            </MenuHeading>

            {menu.enable && menu.isOpen && (
              <MenuList>
                {menu.submenu &&
                  menu.submenu.map((submenu, menuIndex) => (
                    <MenuItemContainer
                      key={`menu-${menuIndex}`}
                      item={submenu}
                      depth={1}
                      handleMenuItemClick={() =>
                        handleItemClick([index, menuIndex])
                      }
                      handleSubmenuItemClick={(submenuIndex: number) =>
                        handleItemClick([index, menuIndex, submenuIndex])
                      }
                    />
                  ))}
              </MenuList>
            )}
          </MenuContainer>
        )
      })}
    </ApplicationMenuContainer>
  )
}
