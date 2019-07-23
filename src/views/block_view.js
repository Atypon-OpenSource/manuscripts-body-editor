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
import { BaseNodeView } from './base_node_view';
export default class BlockView extends BaseNodeView {
    constructor() {
        super(...arguments);
        this.viewAttributes = ['id', 'placeholder', 'paragraphStyle'];
        this.initialise = () => {
            this.createDOM();
            this.createGutter('block-gutter', this.gutterButtons().filter(Boolean));
            this.createElement();
            this.createGutter('action-gutter', this.actionGutterButtons().filter(Boolean));
            this.updateContents();
        };
        this.updateContents = () => {
            this.contentDOM.classList.toggle('empty-node', !this.node.childCount);
            this.updateAttributes();
        };
        this.updateAttributes = () => {
            for (const key of this.viewAttributes) {
                if (key in this.node.attrs) {
                    const value = this.node.attrs[key];
                    if (value) {
                        this.contentDOM.setAttribute(key, value);
                    }
                    else {
                        this.contentDOM.removeAttribute(key);
                    }
                }
            }
        };
        this.createElement = () => {
            this.contentDOM = document.createElement(this.elementType);
            this.contentDOM.className = 'block';
            this.dom.appendChild(this.contentDOM);
        };
        this.applyStyles = (node, styles) => {
            Object.entries(styles).forEach(([key, value]) => {
                node.style.setProperty(key, value);
            });
        };
        this.createDOM = () => {
            this.dom = document.createElement('div');
            this.dom.classList.add('block-container');
            this.dom.classList.add(`block-${this.node.type.name}`);
        };
        this.createGutter = (className, buttons) => {
            const gutter = document.createElement('div');
            gutter.setAttribute('contenteditable', 'false');
            gutter.classList.add(className);
            for (const button of buttons) {
                gutter.appendChild(button);
            }
            this.dom.appendChild(gutter);
        };
        this.gutterButtons = () => [];
        this.actionGutterButtons = () => [];
    }
}
