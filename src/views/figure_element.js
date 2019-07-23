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
import { ObjectTypes, } from '@manuscripts/manuscripts-json-schema';
import BlockView from './block_view';
import { createNodeView } from './creators';
export class FigureElementView extends BlockView {
    constructor() {
        super(...arguments);
        this.ignoreMutation = () => true;
        this.createElement = () => {
            const container = document.createElement('figure-container');
            container.className = 'block';
            this.dom.appendChild(container);
            this.contentDOM = document.createElement('figure');
            this.contentDOM.classList.add('figure-block');
            this.contentDOM.setAttribute('id', this.node.attrs.id);
            this.contentDOM.setAttribute('data-figure-style', this.node.attrs.figureStyle);
            const style = this.figureStyle();
            if (style) {
                if (style.captionPosition === 'above') {
                    this.contentDOM.classList.add('caption-above');
                }
            }
            this.applyStyles(this.contentDOM, this.buildElementStyles(style));
            this.applyStyles(this.contentDOM, this.buildPanelStyles(style));
            container.appendChild(this.contentDOM);
        };
        this.updateContents = () => {
            const { suppressCaption } = this.node.attrs;
            this.dom.classList.toggle('suppress-caption', suppressCaption);
            const layout = this.figureLayout();
            const singleFigure = !layout || layout.rows * layout.columns === 1;
            this.dom.classList.toggle('single-figure', singleFigure);
        };
        this.getDefaultModel = (objectType) => this.props.getModel(`${objectType}:default`);
        this.defaultFigureLayout = () => this.getDefaultModel(ObjectTypes.FigureLayout);
        this.figureLayout = () => {
            const { figureLayout } = this.node.attrs;
            if (figureLayout) {
                const model = this.props.getModel(figureLayout);
                if (model) {
                    return this.mergePrototypeChain(model);
                }
            }
            return this.defaultFigureLayout();
        };
        this.defaultFigureStyle = () => this.getDefaultModel(ObjectTypes.FigureStyle);
        this.figureStyle = () => {
            const { figureStyle } = this.node.attrs;
            if (figureStyle) {
                const model = this.props.getModel(figureStyle);
                if (model) {
                    return this.mergePrototypeChain(model);
                }
            }
            return this.defaultFigureStyle();
        };
        this.mergePrototypeChain = (model) => {
            let modelWithPrototype = model;
            let output = modelWithPrototype;
            while (modelWithPrototype.prototype) {
                const parentModel = this.props.getModel(modelWithPrototype.prototype);
                if (!parentModel) {
                    break;
                }
                if (parentModel.prototype === modelWithPrototype.prototype) {
                    break;
                }
                output = Object.assign({}, parentModel, output);
                modelWithPrototype = parentModel;
            }
            return output;
        };
        this.buildPanelStyles = (style) => {
            const output = {};
            const layout = this.figureLayout();
            if (layout) {
                if (layout.columns) {
                    output['grid-template-columns'] = `repeat(${layout.columns}, 1fr)`;
                }
                if (layout.rows) {
                    output['grid-template-rows'] = `repeat(${layout.rows}, minmax(min-content, max-content)) [caption] [listing] auto`;
                }
            }
            if (style) {
                if (style.innerSpacing) {
                    output['column-gap'] = style.innerSpacing + 'px';
                    output['row-gap'] = style.innerSpacing + 'px';
                }
            }
            return output;
        };
        this.buildElementStyles = (style) => {
            const output = {};
            if (style) {
                if (style.outerSpacing) {
                    output.padding = style.outerSpacing + 'px';
                }
                if (style.outerBorder) {
                    if (style.outerBorder.style) {
                        output['border-style'] = style.outerBorder.style;
                    }
                    output['border-width'] = style.outerBorder.width + 'px';
                    if (style.outerBorder.color) {
                        output['border-color'] = style.outerBorder.color;
                    }
                }
            }
            return output;
        };
    }
}
export default createNodeView(FigureElementView);
