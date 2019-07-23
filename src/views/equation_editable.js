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
import { xmlSerializer } from '@manuscripts/manuscript-transform';
import { createEditableNodeView } from './creators';
import { EquationView } from './equation';
export class EquationEditableView extends EquationView {
    constructor() {
        super(...arguments);
        this.selectNode = () => __awaiter(this, void 0, void 0, function* () {
            const { permissions } = this.props;
            if (!permissions.write) {
                return;
            }
            const { createEditor } = yield import('../lib/codemirror');
            const { typeset } = yield import('../lib/mathjax');
            const placeholder = 'Enter LaTeX equation, e.g. "a^2 = \\sqrt{b^2 + c^2}"';
            const input = yield createEditor({
                value: this.node.attrs.TeXRepresentation || '',
                mode: 'stex',
                placeholder,
                autofocus: true,
            });
            input.on('changes', () => __awaiter(this, void 0, void 0, function* () {
                const TeXRepresentation = input.getValue();
                const typesetRoot = typeset(TeXRepresentation, true);
                if (!typesetRoot || !typesetRoot.firstChild) {
                    throw new Error('No SVG output from MathJax');
                }
                const SVGStringRepresentation = xmlSerializer.serializeToString(typesetRoot.firstChild);
                const tr = this.view.state.tr
                    .setNodeMarkup(this.getPos(), undefined, Object.assign({}, this.node.attrs, { TeXRepresentation,
                    SVGStringRepresentation }))
                    .setSelection(this.view.state.selection);
                this.view.dispatch(tr);
            }));
            const wrapper = document.createElement('div');
            wrapper.appendChild(input.getWrapperElement());
            wrapper.className = 'equation-editor';
            const infoLink = document.createElement('a');
            infoLink.target = '_blank';
            infoLink.textContent = '?';
            infoLink.title = '';
            infoLink.href = 'https://en.wikibooks.org/wiki/LaTeX/Mathematics#Symbols';
            infoLink.className = 'equation-editor-info';
            wrapper.appendChild(infoLink);
            this.props.popper.show(this.dom, wrapper, 'bottom');
            window.requestAnimationFrame(() => {
                input.refresh();
                input.focus();
            });
        });
    }
}
export default createEditableNodeView(EquationEditableView);
