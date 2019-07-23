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
import React from 'react';
import { BaseNodeView } from './base_node_view';
import { createNodeView } from './creators';
export class CitationView extends BaseNodeView {
    constructor() {
        super(...arguments);
        this.showPopper = () => {
            const { components: { CitationViewer }, getLibraryItem, projectID, renderReactComponent, } = this.props;
            const citation = this.getCitation();
            const items = citation.embeddedCitationItems.map((citationItem) => getLibraryItem(citationItem.bibliographyItem));
            if (!this.popperContainer) {
                this.popperContainer = document.createElement('div');
                this.popperContainer.className = 'citation-editor';
            }
            renderReactComponent(React.createElement(CitationViewer, { items: items, projectID: projectID, scheduleUpdate: this.props.popper.update }), this.popperContainer);
            this.props.popper.show(this.dom, this.popperContainer, 'right');
        };
        this.ignoreMutation = () => true;
        this.selectNode = () => {
            this.showPopper();
            this.dom.classList.add('ProseMirror-selectednode');
        };
        this.deselectNode = () => {
            this.dom.classList.remove('ProseMirror-selectednode');
            this.props.popper.destroy();
            if (this.popperContainer) {
                this.props.unmountReactComponent(this.popperContainer);
            }
        };
        this.destroy = () => {
            this.props.popper.destroy();
            if (this.popperContainer) {
                this.props.unmountReactComponent(this.popperContainer);
            }
        };
        this.initialise = () => {
            this.createDOM();
            this.updateContents();
        };
        this.createDOM = () => {
            this.dom = document.createElement('span');
            this.dom.className = 'citation';
            this.dom.setAttribute('data-reference-id', this.node.attrs.rid);
            this.dom.setAttribute('spellcheck', 'false');
        };
        this.updateContents = () => {
            this.dom.innerHTML = sanitize(this.node.attrs.contents);
        };
        this.getCitation = () => {
            const citation = this.props.getModel(this.node.attrs.rid);
            if (!citation) {
                throw new Error('Citation not found');
            }
            return citation;
        };
    }
}
export default createNodeView(CitationView);
