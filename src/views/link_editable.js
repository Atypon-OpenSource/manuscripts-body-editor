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
import { TextSelection } from 'prosemirror-state';
import React from 'react';
import { LinkForm } from '../components/views/LinkForm';
import { createEditableNodeView } from './creators';
import { LinkView } from './link';
export class LinkEditableView extends LinkView {
    constructor() {
        super(...arguments);
        this.selectNode = () => {
            this.showForm();
        };
        this.destroy = () => {
            this.closeForm();
        };
        this.deselectNode = () => {
            this.closeForm();
        };
        this.showForm = (event) => {
            if (event) {
                event.preventDefault();
            }
            if (!this.props.permissions.write) {
                return;
            }
            if (!this.popperContainer) {
                this.popperContainer = document.createElement('div');
                this.popperContainer.className = 'link-editor';
            }
            const originalValue = {
                href: this.node.attrs.href,
                text: this.node.textContent,
            };
            this.props.renderReactComponent(React.createElement(LinkForm, { value: originalValue, handleCancel: () => {
                    const tr = this.view.state.tr;
                    const pos = this.getPos();
                    tr.setSelection(TextSelection.create(tr.doc, pos));
                    this.view.focus();
                    this.view.dispatch(tr);
                    this.closeForm();
                }, handleRemove: () => {
                    const { tr } = this.view.state;
                    const pos = this.getPos();
                    const to = pos + this.node.nodeSize;
                    tr.replaceWith(pos, to, this.node.content).setSelection(TextSelection.create(tr.doc, pos));
                    this.view.focus();
                    this.view.dispatch(tr);
                    this.closeForm();
                }, handleSave: (data) => {
                    const tr = this.view.state.tr;
                    const pos = this.getPos();
                    if (data.href !== originalValue.href) {
                        tr.setNodeMarkup(pos, undefined, Object.assign({}, this.node.attrs, { href: data.href }));
                    }
                    if (data.text !== originalValue.text) {
                        tr.insertText(data.text, pos + 1, pos + this.node.nodeSize - 1);
                    }
                    tr.setSelection(TextSelection.create(tr.doc, pos));
                    this.view.focus();
                    this.view.dispatch(tr);
                    this.closeForm();
                } }), this.popperContainer);
            this.props.popper.show(this.dom, this.popperContainer, 'bottom');
        };
        this.closeForm = () => {
            this.props.popper.destroy();
            if (this.popperContainer) {
                this.props.unmountReactComponent(this.popperContainer);
            }
        };
    }
}
export default createEditableNodeView(LinkEditableView);
