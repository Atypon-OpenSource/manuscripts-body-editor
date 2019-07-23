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
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
export default () => new Plugin({
    props: {
        decorations: state => {
            const decorations = [];
            const decorate = (node, pos) => {
                const { placeholder } = node.attrs;
                if (placeholder &&
                    !node.isAtom &&
                    node.type.isBlock &&
                    node.childCount === 0) {
                    if (node.type === node.type.schema.nodes.paragraph) {
                        const placeholderElement = document.createElement('span');
                        placeholderElement.className = 'placeholder-text';
                        placeholderElement.textContent = placeholder;
                        decorations.push(Decoration.widget(pos + 1, placeholderElement));
                    }
                    else {
                        decorations.push(Decoration.node(pos, pos + node.nodeSize, {
                            class: 'empty-node',
                        }));
                    }
                }
            };
            state.doc.descendants(decorate);
            return DecorationSet.create(state.doc, decorations);
        },
    },
});
