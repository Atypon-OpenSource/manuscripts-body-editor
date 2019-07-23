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
export class InlineFootnoteView extends BaseNodeView {
    constructor() {
        super(...arguments);
        this.initialise = () => {
            this.createDOM();
            this.updateContents();
        };
        this.selectNode = () => {
            this.props.history.push('#' + this.node.attrs.rid);
        };
        this.updateContents = () => {
            this.dom.textContent = this.node.attrs.contents;
        };
        this.ignoreMutation = () => true;
        this.createDOM = () => {
            this.dom = document.createElement('span');
            this.dom.classList.add('footnote');
        };
    }
}
export default createNodeView(InlineFootnoteView);
