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
import { base64StringToBlob } from 'blob-util';
import { createEditableNodeView } from './creators';
import { ListingView } from './listing';
export class ListingEditableView extends ListingView {
    constructor() {
        super(...arguments);
        this.needsFocus = false;
        this.selectNode = () => {
            this.needsFocus = true;
            if (this.editor) {
                this.editor.focus();
            }
        };
        this.createDOM = () => {
            this.dom = document.createElement('div');
            this.dom.classList.add('listing');
            this.setParentFigureElement();
            if (this.parentFigureElement) {
                const { actionsContainer } = this.buildExecutableListingElement();
                if (this.props.permissions.write) {
                    const executeButton = document.createElement('button');
                    executeButton.classList.add('execute-listing');
                    executeButton.classList.add('executable-action');
                    executeButton.addEventListener('mousedown', this.executeListing);
                    executeButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24">
    <path d="M19.211 13.394L5.447 20.276A1 1 0 0 1 4 19.382V5.618a1 1 0 0 1 1.447-.894l13.764 6.882a1 1 0 0 1 0 1.788z" stroke-width="1.5" stroke="#2A6F9D" fill="none" fill-rule="evenodd"/>
  </svg>`;
                    actionsContainer.appendChild(executeButton);
                    const attachButton = document.createElement('button');
                    attachButton.classList.add('attach-listing');
                    attachButton.classList.add('executable-action');
                    attachButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24">
    <path d="M19.098 11.84l-8.517 7.942c-1.165 1.087-3.33 2.278-5.696-.26-2.366-2.537-1.084-4.773.032-5.814l10.377-9.676c.915-.854 2.739-1.431 4.08.006 1.34 1.437.647 3.001-.113 3.71l-9.737 9.08c-1.127 1.05-1.664 1.31-2.41.51-.746-.8-.678-1.436.977-2.995.92-.859 3.125-2.96 6.613-6.305" stroke-width="1.2" stroke="#2A6F9D" fill="none" fill-rule="evenodd" stroke-linecap="round"/>
  </svg>`;
                    attachButton.addEventListener('mousedown', (event) => __awaiter(this, void 0, void 0, function* () {
                        event.preventDefault();
                        yield this.attachListingData();
                        yield this.updateAttachmentsNode();
                    }));
                    actionsContainer.appendChild(attachButton);
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
        this.createEditor = (defaultPlaceholder = '<Listing>') => __awaiter(this, void 0, void 0, function* () {
            if (!this.props.permissions.write) {
                return;
            }
            const { contents, languageKey, placeholder } = this.node.attrs;
            const { createEditor } = yield import('../lib/codemirror');
            const { codemirrorModeOptions } = yield import('../lib/codemirror-modes');
            this.editor = yield createEditor({
                value: contents,
                mode: languageKey in codemirrorModeOptions
                    ? codemirrorModeOptions[languageKey]
                    : languageKey,
                placeholder: placeholder || defaultPlaceholder,
                autofocus: this.needsFocus,
            });
            this.editor.on('changes', () => {
                const contents = this.editor.getValue();
                this.setNodeAttrs({ contents });
            });
            this.container.appendChild(this.editor.getWrapperElement());
            this.container.appendChild(yield this.buildLanguageSelector());
            this.refreshEditor();
        });
        this.toggleText = (contents, isExpanded = false) => {
            if (isExpanded) {
                return 'Hide Code';
            }
            if (contents) {
                return 'Show Code';
            }
            return 'Attach Code';
        };
        this.buildLanguageSelector = () => __awaiter(this, void 0, void 0, function* () {
            const { languageKey } = this.node.attrs;
            const languageSelector = document.createElement('select');
            languageSelector.addEventListener('mousedown', event => {
                event.stopPropagation();
            });
            if (!this.props.permissions.write) {
                languageSelector.setAttribute('disabled', 'disabled');
            }
            const { kernels } = yield import('../lib/jupyter');
            const { codemirrorModeGroups, codemirrorModeLabels, codemirrorModeOptions, } = yield import('../lib/codemirror-modes');
            if (this.parentFigureElement) {
                const textOption = document.createElement('option');
                textOption.textContent = 'Select a language…';
                textOption.setAttribute('value', 'null');
                textOption.setAttribute('disabled', 'disabled');
                if (!languageKey || languageKey === 'null') {
                    textOption.setAttribute('selected', 'selected');
                }
                languageSelector.appendChild(textOption);
                for (const modeKey of Object.keys(kernels)) {
                    const option = document.createElement('option');
                    option.textContent = codemirrorModeLabels[modeKey];
                    option.setAttribute('value', modeKey);
                    if (modeKey === languageKey) {
                        option.setAttribute('selected', 'selected');
                    }
                    languageSelector.appendChild(option);
                }
            }
            else {
                const textOption = document.createElement('option');
                textOption.textContent = 'Plain Text';
                textOption.setAttribute('value', 'null');
                if (!languageKey || languageKey === 'null') {
                    textOption.setAttribute('selected', 'selected');
                }
                languageSelector.appendChild(textOption);
                for (const [groupName, modes] of Object.entries(codemirrorModeGroups)) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.setAttribute('label', groupName);
                    for (const modeKey of modes) {
                        const option = document.createElement('option');
                        option.textContent = codemirrorModeLabels[modeKey];
                        option.setAttribute('value', modeKey);
                        if (modeKey === languageKey) {
                            option.setAttribute('selected', 'selected');
                        }
                        optgroup.appendChild(option);
                    }
                    languageSelector.appendChild(optgroup);
                }
            }
            languageSelector.addEventListener('change', () => {
                const languageKey = languageSelector.value;
                this.editor.setOption('mode', languageKey in codemirrorModeOptions
                    ? codemirrorModeOptions[languageKey]
                    : languageKey);
                this.refreshEditor();
                this.setNodeAttrs({ languageKey });
            });
            return languageSelector;
        });
        this.showOutputs = (outputs) => {
            this.outputNode.innerHTML = '';
            for (const output of outputs) {
                const item = document.createElement('div');
                item.textContent = output.text;
                item.className = `executable-output executable-output-${output.type}`;
                this.outputNode.appendChild(item);
            }
            this.outputNode.scrollTop = this.outputNode.scrollHeight;
        };
        this.executeListing = (event) => __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            const { id, contents } = this.node.attrs;
            if (!contents) {
                return;
            }
            this.setNodeAttrs({ isExecuting: true });
            const rxAttachments = yield this.props.allAttachments(id);
            const attachments = yield Promise.all((rxAttachments || []).map((attachment) => __awaiter(this, void 0, void 0, function* () {
                return {
                    data: yield attachment.getData(),
                    mime: attachment.type,
                    md5: attachment.digest,
                    name: attachment.id,
                };
            })));
            const jupyter = yield import('../lib/jupyter');
            const { KernelMessage } = yield import('@jupyterlab/services');
            const outputs = [];
            this.showOutputs(outputs);
            const images = [];
            const addOutput = (output) => {
                outputs.push(output);
                this.showOutputs(outputs);
            };
            const handleOutput = (message) => {
                if (KernelMessage.isStreamMsg(message)) {
                    const { content: { name, text }, } = message;
                    addOutput({
                        type: name,
                        text,
                    });
                }
                else if (KernelMessage.isDisplayDataMsg(message)) {
                    const { content: { data }, } = message;
                    for (const [type, value] of Object.entries(data)) {
                        if (type.startsWith('image/')) {
                            images.push({ value: String(value), type });
                        }
                    }
                    if (data['text/plain']) {
                        const text = String(data['text/plain']);
                        addOutput({
                            type: 'display',
                            text: `Output: ${text}`,
                        });
                    }
                }
                else if (KernelMessage.isErrorMsg(message)) {
                    const { content: { ename, evalue }, } = message;
                    addOutput({
                        type: 'error',
                        text: `${ename || 'Error'}: ${evalue}`,
                    });
                }
            };
            try {
                yield jupyter.executeKernel(this.props.jupyterConfig, id, attachments, contents, this.node.attrs.languageKey, handleOutput);
            }
            catch (error) {
                addOutput({
                    type: 'error',
                    text: error.message,
                });
            }
            if (images.length > 0) {
                const image = images.pop();
                yield this.handleOutputData(image.value, image.type);
            }
            const hasError = outputs.some(output => output.type === 'error');
            if (!hasError) {
                addOutput({
                    type: 'status',
                    text: '🚀Finished!',
                });
            }
            this.setNodeAttrs({ isExecuting: false });
        });
        this.handleOutputData = (data, contentType) => __awaiter(this, void 0, void 0, function* () {
            const blob = base64StringToBlob(data, contentType);
            const attachmentKey = 'result';
            yield this.props.putAttachment(this.node.attrs.id, {
                id: attachmentKey,
                data: blob,
                type: blob.type,
            });
            const src = window.URL.createObjectURL(blob);
            const figureType = this.view.state.schema.nodes.figure;
            this.parentFigureElement.node.forEach((node, pos) => {
                if (node.type === figureType) {
                    this.view.dispatch(this.view.state.tr.setNodeMarkup(this.parentFigureElement.start + pos, undefined, Object.assign({}, node.attrs, { listingAttachment: {
                            listingID: this.node.attrs.id,
                            attachmentKey,
                        }, src, contentType: blob.type })));
                }
            });
        });
        this.attachListingData = () => {
            const { id } = this.node.attrs;
            return new Promise(resolve => {
                const input = document.createElement('input');
                input.accept = '*/*';
                input.type = 'file';
                input.multiple = true;
                input.addEventListener('change', (event) => __awaiter(this, void 0, void 0, function* () {
                    const target = event.target;
                    if (!target.files) {
                        return;
                    }
                    for (const file of target.files) {
                        yield this.props.putAttachment(id, {
                            data: file,
                            id: file.name,
                            type: file.type,
                        });
                    }
                    resolve();
                }));
                input.click();
            });
        };
    }
}
export default createEditableNodeView(ListingEditableView);
