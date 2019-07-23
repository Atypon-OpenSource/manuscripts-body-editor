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
import { createNodeView } from './creators';
export class FigureView extends BaseNodeView {
    constructor() {
        super(...arguments);
        this.initialise = () => {
            this.createDOM();
            this.updateContents();
        };
        this.ignoreMutation = () => true;
        this.updateContents = () => {
            const { src } = this.node.attrs;
            while (this.container.hasChildNodes()) {
                this.container.removeChild(this.container.firstChild);
            }
            const img = src
                ? this.createFigureImage(src)
                : this.createFigurePlaceholder();
            this.container.appendChild(img);
        };
        this.createFigureImage = (src) => {
            const element = document.createElement('img');
            element.classList.add('figure-image');
            element.src = src;
            return element;
        };
        this.createFigurePlaceholder = () => {
            const element = document.createElement('div');
            element.classList.add('figure');
            element.classList.add('placeholder');
            const instructions = document.createElement('div');
            instructions.textContent = 'No image here yet…';
            element.appendChild(instructions);
            return element;
        };
        this.createDOM = () => {
            this.dom = document.createElement('figure');
            this.dom.setAttribute('id', this.node.attrs.id);
            this.container = document.createElement('div');
            this.container.className = 'figure';
            this.container.contentEditable = 'false';
            this.dom.appendChild(this.container);
            this.contentDOM = document.createElement('div');
            this.contentDOM.className = 'figure-caption';
            this.contentDOM.setAttribute('tabindex', '1337');
            this.dom.appendChild(this.contentDOM);
        };
    }
}
export default createNodeView(FigureView);
