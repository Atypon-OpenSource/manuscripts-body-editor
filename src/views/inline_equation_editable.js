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
import { InlineEquationView } from './inline_equation';
export class InlineEquationEditableView extends InlineEquationView {
    constructor() {
        super(...arguments);
        this.selectNode = () => __awaiter(this, void 0, void 0, function* () {
            if (!this.props.permissions.write) {
                return;
            }
            const { createEditor } = yield import('../lib/codemirror');
            const { typeset } = yield import('../lib/mathjax');
            const placeholder = 'Enter LaTeX equation, e.g. "E=mc^2"';
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
                const SVGRepresentation = xmlSerializer.serializeToString(typesetRoot.firstChild);
                const tr = this.view.state.tr
                    .setNodeMarkup(this.getPos(), undefined, Object.assign({}, this.node.attrs, { TeXRepresentation,
                    SVGRepresentation }))
                    .setSelection(this.view.state.selection);
                this.view.dispatch(tr);
            }));
            this.props.popper.show(this.dom, input.getWrapperElement(), 'bottom');
            window.requestAnimationFrame(() => {
                input.refresh();
                input.focus();
            });
        });
        this.deselectNode = () => {
            this.props.popper.destroy();
        };
    }
}
export default createEditableNodeView(InlineEquationEditableView);
