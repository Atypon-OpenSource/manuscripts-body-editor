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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isFigureElementNode, } from '@manuscripts/manuscript-transform';
import prettyBytes from 'pretty-bytes';
import { BaseNodeView } from './base_node_view';
import { createNodeView } from './creators';
export class ListingView extends BaseNodeView {
    constructor() {
        super(...arguments);
        this.ignoreMutation = () => true;
        this.initialise = () => {
            this.createDOM();
            this.updateContents();
        };
        this.updateContents = () => {
            const { contents, isExpanded, isExecuting } = this.node.attrs;
            if (this.editor) {
                if (isExpanded) {
                    this.editor.refresh();
                    this.updateAttachmentsNode().catch(error => {
                        console.error(error);
                    });
                }
                if (contents !== this.editor.getValue()) {
                    this.editor.setValue(contents);
                }
            }
            if (this.parentFigureElement) {
                this.dom.classList.toggle('expanded-listing', isExpanded);
                this.dom.classList.toggle('executable-executing', isExecuting);
                this.dom.classList.toggle('executable-has-contents', Boolean(contents));
            }
        };
        this.updateAttachmentsNode = () => __awaiter(this, void 0, void 0, function* () {
            const attachments = yield this.props.allAttachments(this.node.attrs.id);
            const { id } = this.node.attrs;
            if (id) {
                this.attachmentsNode.innerHTML = '';
                for (const attachment of attachments) {
                    if (attachment.id === 'result') {
                        continue;
                    }
                    const item = document.createElement('div');
                    item.className = 'executable-attachment';
                    const heading = document.createElement('div');
                    heading.className = 'executable-attachment-heading';
                    heading.textContent = `${attachment.id} (${prettyBytes(attachment.length)})`;
                    item.appendChild(heading);
                    const type = document.createElement('div');
                    type.className = 'executable-attachment-type';
                    type.textContent = attachment.type;
                    item.appendChild(type);
                    this.attachmentsNode.appendChild(item);
                }
            }
        });
        this.buildExecutableListingElement = () => {
            this.dom.setAttribute('tabindex', '1337');
            const executableContainer = document.createElement('div');
            executableContainer.className = 'executable-container';
            this.dom.appendChild(executableContainer);
            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'toggle-container';
            executableContainer.appendChild(toggleContainer);
            const toggleListingButton = document.createElement('button');
            toggleListingButton.className = 'toggle-listing';
            toggleListingButton.addEventListener('mousedown', event => {
                event.preventDefault();
                const { contents, isExpanded } = this.node.attrs;
                this.toggleListing(!isExpanded);
                toggleListingButton.innerHTML = this.toggleIcon(contents, !isExpanded);
                toggleListingButton.appendChild(document.createTextNode(this.toggleText(contents, !isExpanded)));
            });
            const { contents } = this.node.attrs;
            toggleListingButton.innerHTML = this.toggleIcon(contents);
            toggleListingButton.appendChild(document.createTextNode(this.toggleText(contents)));
            toggleContainer.appendChild(toggleListingButton);
            const executableBody = document.createElement('div');
            executableBody.className = 'executable-body';
            executableContainer.appendChild(executableBody);
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'executable-actions';
            executableBody.appendChild(actionsContainer);
            const executableMain = document.createElement('div');
            executableMain.className = 'executable-main';
            executableBody.appendChild(executableMain);
            this.container = document.createElement('div');
            this.container.className = 'executable-content';
            executableMain.appendChild(this.container);
            this.attachmentsNode = document.createElement('div');
            this.attachmentsNode.className = 'executable-attachments';
            executableMain.appendChild(this.attachmentsNode);
            this.outputNode = document.createElement('div');
            this.outputNode.className = 'executable-outputs';
            executableMain.appendChild(this.outputNode);
            this.createEditor('Enter code to be executed…').catch(error => {
                console.error(error);
            });
            return { actionsContainer };
        };
        this.createDOM = () => {
            this.dom = document.createElement('div');
            this.dom.classList.add('listing');
            this.setParentFigureElement();
            if (this.parentFigureElement) {
                if (this.node.attrs.contents) {
                    this.buildExecutableListingElement();
                }
            }
            else {
                this.container = document.createElement('div');
                this.dom.appendChild(this.container);
                this.createEditor().catch(error => {
                    console.error(error);
                });
            }
        };
        this.toggleText = (contents, isExpanded = false) => (isExpanded ? 'Hide Code' : 'Show Code');
        this.toggleIcon = (contents, isExpanded = false) => {
            if (isExpanded) {
                return `<svg width="12" height="12" xmlns:xlink="http://www.w3.org/1999/xlink" class="toggle-icon">
  <defs>
    <path id="b" d="M6 2l5 8H1z"/>
    <filter x="-305%" y="-256.2%" width="710%" height="862.5%" filterUnits="objectBoundingBox" id="a">
      <feOffset dy="10" in="SourceAlpha" result="shadowOffsetOuter1"/>
      <feGaussianBlur stdDeviation="8.5" in="shadowOffsetOuter1" result="shadowBlurOuter1"/>
      <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.0345052083 0" in="shadowBlurOuter1"/>
    </filter>
  </defs>
  <g transform="rotate(180 6 6)" fill="none" fill-rule="evenodd">
    <use fill="#000" filter="url(#a)" xlink:href="#b"/>
    <use fill="#949494" xlink:href="#b"/>
  </g>
</svg>`;
            }
            if (contents) {
                return `<svg width="12" height="12" xmlns:xlink="http://www.w3.org/1999/xlink" class="toggle-icon">
  <defs>
    <path id="b" d="M6 2l5 8H1z"/>
    <filter x="-305%" y="-256.2%" width="710%" height="862.5%" filterUnits="objectBoundingBox" id="a">
      <feOffset dy="10" in="SourceAlpha" result="shadowOffsetOuter1"/>
      <feGaussianBlur stdDeviation="8.5" in="shadowOffsetOuter1" result="shadowBlurOuter1"/>
      <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.0345052083 0" in="shadowBlurOuter1"/>
    </filter>
  </defs>
  <g transform="rotate(90 6 6)" fill="none" fill-rule="evenodd">
    <use fill="#000" filter="url(#a)" xlink:href="#b"/>
    <use fill="#949494" xlink:href="#b"/>
  </g>
</svg>`;
            }
            return `<svg width="16" height="17" viewBox="0 0 32 34" class="toggle-icon">
  <g fill="none" fill-rule="evenodd">
    <path d="M20.5 2.278l6 3.464a9 9 0 0 1 4.5 7.794v6.928a9 9 0 0 1-4.5 7.794l-6 3.464a9 9 0 0 1-9 0l-6-3.464A9 9 0 0 1 1 20.464v-6.928a9 9 0 0 1 4.5-7.794l6-3.464a9 9 0 0 1 9 0z" fill="#FDCD47"/>
    <path d="M15.255 15.707v-6a.75.75 0 1 1 1.5 0v6h6a.75.75 0 0 1 0 1.5h-6v6a.75.75 0 0 1-1.5 0v-6h-6a.75.75 0 1 1 0-1.5h6z" stroke="#FFF" fill="#FFF"/>
  </g>
</svg>`;
        };
        this.createEditor = (defaultPlaceholder = '<Listing>') => __awaiter(this, void 0, void 0, function* () {
            const { contents, languageKey, placeholder } = this.node.attrs;
            const { createEditor } = yield import('../lib/codemirror');
            const { codemirrorModeOptions } = yield import('../lib/codemirror-modes');
            this.editor = yield createEditor({
                readOnly: true,
                value: contents,
                mode: languageKey in codemirrorModeOptions
                    ? codemirrorModeOptions[languageKey]
                    : languageKey,
                placeholder: placeholder || defaultPlaceholder,
                autofocus: false,
            });
            this.container.appendChild(this.editor.getWrapperElement());
            this.refreshEditor();
        });
        this.refreshEditor = () => {
            window.requestAnimationFrame(() => {
                this.editor.refresh();
            });
        };
        this.focusEditor = () => {
            window.requestAnimationFrame(() => {
                this.editor.focus();
            });
        };
        this.setParentFigureElement = () => {
            const pos = this.getPos();
            const $pos = this.view.state.doc.resolve(pos);
            const parent = $pos.node($pos.depth);
            if (isFigureElementNode(parent)) {
                this.parentFigureElement = {
                    node: parent,
                    before: $pos.before($pos.depth - 1),
                    start: $pos.start($pos.depth),
                };
            }
        };
        this.toggleListing = (isExpanded) => {
            this.setNodeAttrs({ isExpanded });
            if (isExpanded) {
                this.refreshEditor();
                this.focusEditor();
            }
        };
        this.setNodeAttrs = (attrs) => {
            this.view.dispatch(this.view.state.tr.setNodeMarkup(this.getPos(), undefined, Object.assign({}, this.node.attrs, attrs)));
        };
    }
}
export default createNodeView(ListingView);
