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
import {
  ManuscriptEditorState,
  ManuscriptEditorView,
} from '@manuscripts/manuscript-transform'
import React from 'react'
import { Manager, Popper, Reference } from 'react-popper'
import styled from 'styled-components'

import { MenuItem, MenuSeparator } from './ApplicationMenu'
import { Shortcut } from './Shortcut'

export const Text = styled.div`
  flex: 1;
`

export const MenuList = styled.div`
  background: ${(props) => props.theme.colors.background.primary};
  border: 1px solid ${(props) => props.theme.colors.border.secondary};
  border-radius: ${(props) => props.theme.grid.radius.small};
  box-shadow: ${(props) => props.theme.shadow.dropShadow};
  color: ${(props) => props.theme.colors.text.primary};
  min-width: 150px;
  padding: ${(props) => props.theme.grid.unit}px 0;
  white-space: nowrap;
  width: auto;
  z-index: 10;
  max-height: 80vh;
  overflow-y: auto;

  &[data-placement='bottom-start'] {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  &[data-placement='right-start'] {
    top: ${(props) => props.theme.grid.unit * 2}px;
  }
`

const Separator = styled.div`
  height: 0;
  border-bottom: 1px solid ${(props) => props.theme.colors.border.secondary};
  margin: ${(props) => props.theme.grid.unit}px 0;
`

const Active = styled.div`
  width: ${(props) => props.theme.grid.unit * 4}px;
  display: inline-flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
`

const Arrow = styled(TriangleCollapsed)`
  margin-left: ${(props) => props.theme.grid.unit * 2}px;
`

const Container = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  padding: ${(props) => props.theme.grid.unit * 2}px
    ${(props) => props.theme.grid.unit * 4}px
    ${(props) => props.theme.grid.unit * 2}px
    ${(props) => props.theme.grid.unit}px;
  position: relative;

  &:hover {
    background: ${(props) => props.theme.colors.background.fifth};
  }

  &.disabled {
    cursor: default;
    opacity: 0.4;
  }
`

interface MenuItemProps {
  item: MenuItem | MenuSeparator
  view: ManuscriptEditorView
  closeMenu: () => void
}

interface MenuItemState {
  isOpen: boolean
  isDropdownOpen: boolean
}

const classNameFromState = (item: MenuItem, state: ManuscriptEditorState) =>
  item.enable && !item.enable(state) ? 'disabled' : ''

const activeContent = (item: MenuItem, state: ManuscriptEditorState) =>
  item.active && item.active(state) ? '✓' : ''

const isSeparator = (item: MenuItem | MenuSeparator): item is MenuSeparator =>
  item.role === 'separator'

export class MenuItemContainer extends React.Component<
  MenuItemProps,
  MenuItemState
> {
  public state = {
    isOpen: false,
    isDropdownOpen: false,
  }

  private menuTimeout?: number

  public render(): React.ReactNode | null {
    const { item, view, closeMenu } = this.props
    const { isOpen } = this.state

    if (isSeparator(item)) {
      return <Separator />
    }

    if (!item.submenu) {
      return (
        <Container
          className={classNameFromState(item, view.state)}
          onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
            event.preventDefault()

            if (item.run) {
              item.run(view.state, view.dispatch)
              closeMenu()
            } else {
              // console.warn('No dropdown or run')
            }
          }}
        >
          <Active>{activeContent(item, view.state)}</Active>
          <Text>{item.label(view.state)}</Text>
          {item.accelerator && <Shortcut accelerator={item.accelerator} />}
        </Container>
      )
    }

    return (
      <div onMouseLeave={this.closeMenu}>
        <Manager>
          <Reference>
            {({ ref }) => (
              <Container
                // @ts-ignore: styled
                ref={ref}
                onMouseEnter={() => {
                  if (!item.enable || item.enable(view.state)) {
                    this.openMenu()
                  }
                }}
                className={classNameFromState(item, view.state)}
              >
                <Active>{activeContent(item, view.state)}</Active>
                <Text>{item.label(view.state)}</Text>
                {item.submenu && <Arrow />}
                {item.accelerator && (
                  <Shortcut accelerator={item.accelerator} />
                )}
              </Container>
            )}
          </Reference>
          {isOpen && (
            <Popper placement="right-start">
              {({ ref, style, placement }) => (
                <MenuList
                  // @ts-ignore: styled
                  ref={ref}
                  style={style}
                  data-placement={placement}
                >
                  {item.submenu &&
                    item.submenu.map((menu, index) => (
                      <MenuItemContainer
                        key={`menu-${index}`}
                        item={menu}
                        view={view}
                        closeMenu={closeMenu}
                      />
                    ))}
                </MenuList>
              )}
            </Popper>
          )}
        </Manager>
      </div>
    )
  }

  private openMenu = () => {
    window.clearTimeout(this.menuTimeout)

    this.menuTimeout = window.setTimeout(() => {
      this.setState({
        isOpen: true,
      })
    }, 100)
  }

  private closeMenu = () => {
    window.clearTimeout(this.menuTimeout)

    this.menuTimeout = window.setTimeout(() => {
      this.setState({
        isOpen: false,
      })
    }, 100)
  }
}
