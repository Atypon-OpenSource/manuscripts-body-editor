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
import TriangleCollapsed from '@manuscripts/assets/react/TriangleCollapsed';
import React from 'react';
import { Manager, Popper, Reference } from 'react-popper';
import styled from 'styled-components';
import { Shortcut, ShortcutContainer } from './Shortcut';
export const Text = styled.div `
  flex: 1;
`;
export const MenuList = styled.div `
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
`;
const Separator = styled.div `
  height: 0;
  border-bottom: 1px solid #ddd;
  margin: 4px 0;
`;
const Icon = styled.div `
  display: none; // inline-flex; // TODO: width from config?
  flex-shrink: 0;
  margin: 0 8px;
`;
const Active = styled.div `
  width: 16px;
  display: inline-flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
`;
const Arrow = styled(TriangleCollapsed) `
  margin-left: 8px;

  & use[fill='#949494'] {
    fill: #444;
  }
`;
const Container = styled.div `
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
`;
const classNameFromState = (item, state) => item.enable && !item.enable(state) ? 'disabled' : '';
const activeContent = (item, state) => item.active && item.active(state) ? '✓' : '';
const isSeparator = (item) => item.role === 'separator';
export class MenuItemContainer extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            isOpen: false,
            isDropdownOpen: false,
        };
        this.openMenu = () => {
            window.clearTimeout(this.menuTimeout);
            this.menuTimeout = window.setTimeout(() => {
                this.setState({
                    isOpen: true,
                });
            }, 100);
        };
        this.closeMenu = () => {
            window.clearTimeout(this.menuTimeout);
            this.menuTimeout = window.setTimeout(() => {
                this.setState({
                    isOpen: false,
                });
            }, 100);
        };
    }
    render() {
        const { item, view, closeMenu } = this.props;
        const { isOpen } = this.state;
        if (isSeparator(item))
            return React.createElement(Separator, null);
        if (!item.submenu) {
            return (React.createElement(Container, { className: classNameFromState(item, view.state), onMouseDown: (event) => {
                    event.preventDefault();
                    if (item.run) {
                        item.run(view.state, view.dispatch);
                        closeMenu();
                    }
                    else {
                    }
                } },
                React.createElement(Active, null, activeContent(item, view.state)),
                item.icon && React.createElement(Icon, null, item.icon),
                React.createElement(Text, null, item.label(view.state)),
                item.accelerator && React.createElement(Shortcut, { accelerator: item.accelerator })));
        }
        return (React.createElement("div", { onMouseLeave: this.closeMenu },
            React.createElement(Manager, null,
                React.createElement(Reference, null, ({ ref }) => (React.createElement(Container, { ref: ref, onMouseEnter: () => {
                        if (!item.enable || item.enable(view.state)) {
                            this.openMenu();
                        }
                    }, className: classNameFromState(item, view.state) },
                    React.createElement(Active, null, activeContent(item, view.state)),
                    item.icon && React.createElement(Icon, null, item.icon),
                    React.createElement(Text, null, item.label(view.state)),
                    item.submenu && React.createElement(Arrow, null),
                    item.accelerator && (React.createElement(Shortcut, { accelerator: item.accelerator }))))),
                isOpen && (React.createElement(Popper, { placement: "right-start" }, ({ ref, style, placement }) => (React.createElement(MenuList, { ref: ref, style: style, "data-placement": placement }, item.submenu &&
                    item.submenu.map((menu, index) => (React.createElement(MenuItemContainer, { key: `menu-${index}`, item: menu, view: view, closeMenu: closeMenu }))))))))));
    }
}
