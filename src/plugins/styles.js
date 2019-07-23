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
export default (props) => {
    const findBorderStyle = (item) => {
        const defaultStyle = {
            doubleLines: false,
        };
        if (!item.innerBorder.style)
            return defaultStyle;
        const style = props.getModel(item.innerBorder.style);
        return style || defaultStyle;
    };
    const styleString = (id) => {
        const item = props.getModel(id);
        if (!item)
            return '';
        const borderStyle = findBorderStyle(item);
        const styles = [
            ['border-color', item.innerBorder.color],
            ['border-width', item.innerBorder.width + 'px'],
            ['border-style', borderStyle.doubleLines ? 'double' : 'solid'],
        ];
        return styles.map(style => style.join(':')).join(';');
    };
    return new Plugin({
        props: {
            decorations: state => {
                const decorations = [];
                state.doc.descendants((node, pos) => {
                    if (node.attrs.figureStyle) {
                        decorations.push(Decoration.node(pos, pos + node.nodeSize, {
                            style: styleString(node.attrs.figureStyle),
                        }));
                    }
                });
                return DecorationSet.create(state.doc, decorations);
            },
        },
        appendTransaction: (transactions, oldState, newState) => {
            const tr = newState.tr;
            if (!transactions.some(transaction => transaction.docChanged))
                return null;
            const { nodes } = newState.schema;
            const listNodeTypes = [nodes.bullet_list, nodes.ordered_list];
            const nodesToUpdate = [];
            newState.doc.descendants((node, pos) => {
                if (!('paragraphStyle' in node.attrs)) {
                    return true;
                }
                if (!node.attrs.paragraphStyle) {
                    nodesToUpdate.push({ node, pos });
                }
                if (listNodeTypes.includes(node.type)) {
                    return false;
                }
            });
            if (nodesToUpdate.length) {
                if (props.manuscript.pageLayout) {
                    const pageLayout = props.getModel(props.manuscript.pageLayout);
                    if (pageLayout) {
                        for (const { node, pos } of nodesToUpdate) {
                            tr.setNodeMarkup(pos, undefined, Object.assign({}, node.attrs, { paragraphStyle: pageLayout.defaultParagraphStyle }));
                        }
                    }
                    return tr.setSelection(newState.selection);
                }
            }
        },
    });
};
