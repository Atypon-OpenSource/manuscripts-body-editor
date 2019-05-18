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
import { Shortcut, ShortcutContainer } from './Shortcut'

export const Text = styled.div`
  flex: 1;
`

export const MenuList = styled.div`
  width: auto;
  min-width: 150px;
  white-space: nowrap;
  box-shadow: 0 3px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid #ddd;
  border-radius: 5px;
  color: #444;
  padding: 4px 0;
  background: white;
  z-index: 10;

  &[data-placement='bottom-start'] {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  &[data-placement='right-start'] {
    top: 10px;
  }
`

const Separator = styled.div`
  height: 0;
  border-bottom: 1px solid #ddd;
  margin: 4px 0;
`

const Icon = styled.div`
  display: none; // inline-flex; // TODO: width from config?
  flex-shrink: 0;
  margin: 0 8px;
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

  & use[fill='#949494'] {
    fill: #444;
  }
`

const Container = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  padding: 8px 16px 8px 4px;

  &:hover {
    background: #7fb5d5;
    color: white;
  }

  &:hover ${Arrow} use[fill='#949494'] {
    fill: white;
  }

  &:hover ${ShortcutContainer} {
    color: white;
  }

  &.disabled {
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

    if (isSeparator(item)) return <Separator />

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
          {item.icon && <Icon>{item.icon}</Icon>}
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
                {item.icon && <Icon>{item.icon}</Icon>}
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
