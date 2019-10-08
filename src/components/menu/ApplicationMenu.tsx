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

import {
  ManuscriptEditorState,
  ManuscriptEditorView,
} from '@manuscripts/manuscript-transform'
import { Transaction } from 'prosemirror-state'
import React from 'react'
import Modal from 'react-modal'
import { Manager, Popper, Reference } from 'react-popper'
import styled from 'styled-components'
import { MenuItemContainer, MenuList, Text } from './MenuItemContainer'

Modal.setAppElement('#root')

const ApplicationMenuContainer = styled.div`
  display: flex;
  font-size: ${props => props.theme.font.size.normal};
`

const MenuHeading = styled.div<{ isOpen: boolean }>`
  display: inline-flex;
  padding: ${props => props.theme.grid.unit}px
    ${props => props.theme.grid.unit * 2}px;
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom: none;
`

const MenuContainer = styled.div<{ isActive: boolean; isEnabled: boolean }>`
  & ${MenuHeading} {
    background-color: ${props =>
      props.isEnabled
        ? props.isActive
          ? props.theme.colors.background.fifth
          : props.theme.colors.background.primary
        : 'transparent'};
    color: ${props =>
      props.isEnabled
        ? props.isActive
          ? props.theme.colors.text.tertiary
          : props.theme.colors.text.primary
        : props.theme.colors.muted};

    &:hover {
      background-color: ${props =>
        props.isEnabled
          ? props.theme.colors.background.fifth
          : props.theme.colors.background.primary};
    }
  }
`

export interface MenuSeparator {
  role: 'separator'
}

export interface Accelerator {
  mac: string
  pc: string
}

export interface MenuItem {
  id: string
  label: (state: ManuscriptEditorState) => React.ReactNode
  role?: string
  type?: string
  accelerator?: Accelerator
  active?: (state: ManuscriptEditorState) => boolean
  enable?: (state: ManuscriptEditorState) => boolean
  run?: (state: ManuscriptEditorState, dispatch: Dispatch) => void
  submenu?: Array<MenuItem | MenuSeparator>
}

type Dispatch = (tr: Transaction) => void

interface Props {
  menus: MenuItem[]
  view: ManuscriptEditorView
}

interface State {
  activeMenu: number | null
}

export class ApplicationMenu extends React.Component<Props, State> {
  public state: Readonly<State> = {
    activeMenu: null,
  }

  private readonly containerRef: React.RefObject<HTMLDivElement>

  public constructor(props: Props) {
    super(props)
    this.containerRef = React.createRef()
  }

  public componentDidMount() {
    this.addBlurListener()
  }

  public componentWillUnmount() {
    this.removeClickListener()
    this.removeBlurListener()
  }

  public render() {
    const { menus, view } = this.props
    const { activeMenu } = this.state

    return (
      <ApplicationMenuContainer ref={this.containerRef}>
        {menus.map((menu, index) => {
          const isEnabled = !menu.enable || menu.enable(view.state)

          return (
            <MenuContainer
              key={`menu-${index}`}
              isActive={activeMenu === index}
              isEnabled={isEnabled}
            >
              <Manager>
                <Reference>
                  {({ ref }) => (
                    <MenuHeading
                      ref={ref}
                      onMouseDown={event => {
                        event.preventDefault()
                        this.setActiveMenu(activeMenu !== null ? null : index)
                      }}
                      onMouseEnter={() => {
                        if (activeMenu !== null) {
                          this.setActiveMenu(index)
                        }
                      }}
                      isOpen={activeMenu === index}
                    >
                      <Text>{menu.label(view.state)}</Text>
                    </MenuHeading>
                  )}
                </Reference>

                {isEnabled && activeMenu === index && (
                  <Popper placement="bottom-start">
                    {({ ref, style, placement }) => (
                      <MenuList
                        ref={ref}
                        style={style}
                        data-placement={placement}
                      >
                        {menu.submenu &&
                          menu.submenu.map((submenu, submenuIndex) => (
                            <MenuItemContainer
                              key={`menu-${submenuIndex}`}
                              item={submenu}
                              view={view}
                              closeMenu={() => {
                                this.setActiveMenu(null)
                              }}
                            />
                          ))}
                      </MenuList>
                    )}
                  </Popper>
                )}
              </Manager>
            </MenuContainer>
          )
        })}
      </ApplicationMenuContainer>
    )
  }

  private setActiveMenu = (index: number | null) => {
    this.setState({
      activeMenu: index,
    })

    if (index !== null) {
      this.addClickListener()
    }
  }

  private addClickListener = () => {
    document.addEventListener('mousedown', this.handleClick)
  }

  private removeClickListener = () => {
    document.removeEventListener('mousedown', this.handleClick)
  }

  private handleClick = (event: MouseEvent) => {
    if (
      this.containerRef.current &&
      !this.containerRef.current.contains(event.target as Node)
    ) {
      this.setActiveMenu(null)
      this.removeClickListener()
    }
  }

  private addBlurListener = () => {
    window.addEventListener('blur', this.handleBlur)
  }

  private removeBlurListener = () => {
    window.removeEventListener('blur', this.handleBlur)
  }

  private handleBlur = () => {
    this.setActiveMenu(null)
  }
}

// TODO: menu navigation by keyboard
