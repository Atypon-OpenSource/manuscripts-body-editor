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
import { sanitize } from 'dompurify';
import { BaseNodeView } from './base_node_view';
import { createNodeView } from './creators';
export class InlineEquationView extends BaseNodeView {
    constructor() {
        super(...arguments);
        this.initialise = () => {
            this.createDOM();
            this.updateContents();
        };
        this.updateContents = () => {
            const { SVGRepresentation } = this.node.attrs;
            if (SVGRepresentation) {
                this.dom.innerHTML = sanitize(SVGRepresentation, {
                    USE_PROFILES: { svg: true },
                });
            }
            else {
                while (this.dom.hasChildNodes()) {
                    this.dom.removeChild(this.dom.firstChild);
                }
                const placeholder = document.createElement('div');
                placeholder.className = 'equation-placeholder';
                placeholder.textContent = '<Equation>';
                this.dom.appendChild(placeholder);
            }
        };
        this.ignoreMutation = () => true;
        this.createDOM = () => {
            this.dom = document.createElement('span');
            this.dom.classList.add('equation');
        };
    }
}
export default createNodeView(InlineEquationView);
