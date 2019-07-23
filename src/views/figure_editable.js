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
import { createEditableNodeView } from './creators';
import { FigureView } from './figure';
export class FigureEditableView extends FigureView {
    constructor() {
        super(...arguments);
        this.updateContents = () => {
            const { src } = this.node.attrs;
            while (this.container.hasChildNodes()) {
                this.container.removeChild(this.container.firstChild);
            }
            const img = src
                ? this.createFigureImage(src)
                : this.createFigurePlaceholder();
            if (this.props.permissions.write) {
                const input = document.createElement('input');
                input.accept = 'image/*';
                input.type = 'file';
                input.addEventListener('change', (event) => __awaiter(this, void 0, void 0, function* () {
                    const target = event.target;
                    if (target.files && target.files.length) {
                        yield this.updateFigure(target.files[0]);
                    }
                }));
                img.addEventListener('click', () => {
                    input.click();
                });
                img.addEventListener('mouseenter', () => {
                    img.classList.toggle('over', true);
                });
                img.addEventListener('mouseleave', () => {
                    img.classList.toggle('over', false);
                });
                img.addEventListener('dragenter', event => {
                    event.preventDefault();
                    img.classList.toggle('over', true);
                });
                img.addEventListener('dragleave', () => {
                    img.classList.toggle('over', false);
                });
                img.addEventListener('dragover', event => {
                    if (event.dataTransfer && event.dataTransfer.items) {
                        for (const item of event.dataTransfer.items) {
                            if (item.kind === 'file' && item.type.startsWith('image/')) {
                                event.preventDefault();
                                event.dataTransfer.dropEffect = 'copy';
                            }
                        }
                    }
                });
                img.addEventListener('drop', event => {
                    if (event.dataTransfer && event.dataTransfer.files) {
                        event.preventDefault();
                        this.updateFigure(event.dataTransfer.files[0]).catch(error => {
                            console.error(error);
                        });
                    }
                });
            }
            this.container.appendChild(img);
        };
        this.createFigurePlaceholder = () => {
            const element = document.createElement('div');
            element.classList.add('figure');
            element.classList.add('placeholder');
            const instructions = document.createElement('div');
            instructions.textContent = 'Click to select an image file';
            instructions.style.pointerEvents = 'none';
            element.appendChild(instructions);
            return element;
        };
        this.updateFigure = (file) => __awaiter(this, void 0, void 0, function* () {
            const { id } = this.node.attrs;
            const attachment = yield this.props.putAttachment(id, {
                id: 'image',
                type: file.type,
                data: file,
            });
            const blob = yield attachment.getData();
            const src = window.URL.createObjectURL(blob);
            this.view.dispatch(this.view.state.tr
                .setNodeMarkup(this.getPos(), undefined, Object.assign({}, this.node.attrs, { src, contentType: file.type }))
                .setSelection(this.view.state.selection));
        });
    }
}
export default createEditableNodeView(FigureEditableView);
