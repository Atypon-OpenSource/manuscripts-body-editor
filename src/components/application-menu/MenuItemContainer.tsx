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

import TriangleCollapsed from '@manuscripts/assets/react/TriangleCollapsed'
import React from 'react'
import styled from 'styled-components'

import { Shortcut } from './Shortcut'
import { MenuItem } from './types'

export const Text = styled.div`
  flex: 1 0 auto;
`

export const MenuList = styled.div`
  background: ${(props) => props.theme.colors.background.primary};
  border: 1px solid ${(props) => props.theme.colors.border.secondary};
  border-radius: ${(props) => props.theme.grid.radius.small};
  box-shadow: ${(props) => props.theme.shadow.dropShadow};
  color: ${(props) => props.theme.colors.text.primary};
  font-size: ${(props) => props.theme.font.size.normal};
  min-width: 150px;
  padding: ${(props) => props.theme.grid.unit}px 0;
  white-space: nowrap;
  width: auto;
  z-index: 10;
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: visible;

  &[data-placement='bottom-start'] {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  &[data-placement='right-start'] {
    top: ${(props) => props.theme.grid.unit * 2}px;
  }
`

const SubmenuContainer = styled.div`
  position: relative;
`

const SubmenuList = styled(MenuList)`
  top: 0;
  left: 100%;
`

const Separator = styled.div`
  height: 0;
  border-bottom: 1px solid #e2e2e2;
  margin: 4px 0;
`

const Active = styled.div`
  width: 16px;
  display: inline-flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
`

const Arrow = styled(TriangleCollapsed)`
  margin-left: 8px;
`

const Container = styled.div<{ isOpen: boolean }>`
  align-items: center;
  cursor: pointer;
  display: flex;
  padding: 8px 16px 8px 4px;
  position: relative;
  ${(props) => props.isOpen && 'background: #f2fbfc;'}

  &:hover {
    background: #f2fbfc;
  }

  &.disabled {
    cursor: default;
    opacity: 0.4;
  }
`

interface Props {
  item: MenuItem
  handleMenuItemClick: () => void
  handleSubmenuItemClick?: (index: number) => void
  depth: number
}

const classNameFromState = (item: MenuItem) => (item.enable ? '' : 'disabled')

const activeContent = (item: MenuItem) => (item.active ? '✓' : '')

const isSeparator = (item: MenuItem) => item.role === 'separator'

export const MenuItemContainer: React.FC<Props> = ({
  item,
  handleMenuItemClick,
  handleSubmenuItemClick,
  depth,
}) => {
  if (isSeparator(item)) {
    return <Separator />
  }

  if (!item.submenu) {
    return (
      <Container
        isOpen={item.isOpen}
        className={classNameFromState(item)}
        onMouseDown={(e) => {
          e.preventDefault()
          handleMenuItemClick()
        }}
      >
        <Active>{activeContent(item)}</Active>
        <Text>{item.label}</Text>
        {item.accelerator && <Shortcut accelerator={item.accelerator} />}
      </Container>
    )
  }

  return (
    <SubmenuContainer>
      <Container
        onMouseDown={(e) => {
          e.preventDefault()
          handleMenuItemClick()
        }}
        isOpen={item.isOpen}
        className={classNameFromState(item)}
      >
        <Active>{activeContent(item)}</Active>
        <Text>{item.label}</Text>
        {item.submenu && <Arrow />}
        {item.accelerator && <Shortcut accelerator={item.accelerator} />}
      </Container>
      {item.isOpen && (
        <SubmenuList>
          {item.submenu &&
            item.submenu.map((menu, index) => (
              <MenuItemContainer
                key={`menu-${index}`}
                item={menu}
                handleMenuItemClick={() => {
                  if (!handleSubmenuItemClick) {
                    return
                  }
                  handleSubmenuItemClick(index)
                }}
                depth={depth + 1}
              />
            ))}
        </SubmenuList>
      )}
    </SubmenuContainer>
  )
}
