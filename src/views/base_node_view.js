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
export class BaseNodeView {
    constructor(props, node, view, getPos) {
        this.props = props;
        this.node = node;
        this.view = view;
        this.getPos = getPos;
        this.elementType = 'div';
        this.update = (newNode, decorations) => {
            if (newNode.attrs.id !== this.node.attrs.id)
                return false;
            if (newNode.type.name !== this.node.type.name)
                return false;
            this.handleDecorations(decorations);
            this.node = newNode;
            this.updateContents();
            this.props.popper.update();
            return true;
        };
        this.initialise = () => {
        };
        this.updateContents = () => {
        };
        this.selectNode = () => {
            this.dom.classList.add('ProseMirror-selectednode');
        };
        this.deselectNode = () => {
            this.dom.classList.remove('ProseMirror-selectednode');
            this.props.popper.destroy();
        };
        this.handleDecorations = (decorations) => {
            if (decorations) {
                const syncErrorDecoration = decorations.find(decoration => decoration.spec.syncErrors);
                this.syncErrors = syncErrorDecoration
                    ? syncErrorDecoration.spec.syncErrors
                    : [];
                this.dom.classList.toggle('has-sync-error', this.syncErrors.length > 0);
            }
        };
    }
}
