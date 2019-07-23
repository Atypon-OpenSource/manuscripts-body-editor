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
import React from 'react';
import Modal from 'react-modal';
import { Manager, Popper, Reference } from 'react-popper';
import styled from 'styled-components';
import { MenuItemContainer, MenuList, Text } from './MenuItemContainer';
Modal.setAppElement('#root');
const ApplicationMenuContainer = styled.div `
  display: flex;
  font-size: 14px;
`;
const MenuHeading = styled.div `
  display: inline-flex;
  padding: 4px 8px;
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom: none;
`;
const MenuContainer = styled.div `
  & ${MenuHeading} {
    color: ${props => {
    if (!props.isEnabled) {
        return '#aaa';
    }
    return 'inherit';
}};
  }

  & ${MenuHeading}:hover {
    background: ${props => {
    if (!props.isEnabled) {
        return 'inherit';
    }
    if (props.isActive) {
        return '#7fb5d5';
    }
    return '#eee';
}};

    color: ${props => {
    if (!props.isEnabled) {
        return '#aaa';
    }
    if (props.isActive) {
        return '#fff';
    }
    return 'inherit';
}};
  }
`;
export class ApplicationMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeMenu: null,
        };
        this.setActiveMenu = (index) => {
            this.setState({
                activeMenu: index,
            });
            if (index !== null) {
                this.addClickListener();
            }
        };
        this.addClickListener = () => {
            document.addEventListener('mousedown', this.handleClick);
        };
        this.removeClickListener = () => {
            document.removeEventListener('mousedown', this.handleClick);
        };
        this.handleClick = (event) => {
            if (this.containerRef.current &&
                !this.containerRef.current.contains(event.target)) {
                this.setActiveMenu(null);
                this.removeClickListener();
            }
        };
        this.addBlurListener = () => {
            window.addEventListener('blur', this.handleBlur);
        };
        this.removeBlurListener = () => {
            window.removeEventListener('blur', this.handleBlur);
        };
        this.handleBlur = () => {
            this.setActiveMenu(null);
        };
        this.containerRef = React.createRef();
    }
    componentDidMount() {
        this.addBlurListener();
    }
    componentWillUnmount() {
        this.removeClickListener();
        this.removeBlurListener();
    }
    render() {
        const { menus, view } = this.props;
        const { activeMenu } = this.state;
        return (React.createElement(ApplicationMenuContainer, { ref: this.containerRef }, menus.map((menu, index) => {
            const isEnabled = !menu.enable || menu.enable(view.state);
            return (React.createElement(MenuContainer, { key: `menu-${index}`, isActive: activeMenu === index, isEnabled: isEnabled },
                React.createElement(Manager, null,
                    React.createElement(Reference, null, ({ ref }) => (React.createElement(MenuHeading, { ref: ref, onMouseDown: event => {
                            event.preventDefault();
                            this.setActiveMenu(activeMenu !== null ? null : index);
                        }, onMouseEnter: () => {
                            if (activeMenu !== null) {
                                this.setActiveMenu(index);
                            }
                        }, isOpen: activeMenu === index },
                        React.createElement(Text, null, menu.label(view.state))))),
                    isEnabled && activeMenu === index && (React.createElement(Popper, { placement: "bottom-start" }, ({ ref, style, placement }) => (React.createElement(MenuList, { ref: ref, style: style, "data-placement": placement }, menu.submenu &&
                        menu.submenu.map((submenu, submenuIndex) => (React.createElement(MenuItemContainer, { key: `menu-${submenuIndex}`, item: submenu, view: view, closeMenu: () => {
                                this.setActiveMenu(null);
                            } }))))))))));
        })));
    }
}
