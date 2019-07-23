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
import { generateNodeID, } from '@manuscripts/manuscript-transform';
import { Plugin } from 'prosemirror-state';
export default () => {
    return new Plugin({
        appendTransaction: (transactions, oldState, newState) => {
            const tr = newState.tr;
            if (!transactions.some(transaction => transaction.docChanged))
                return null;
            const { nodes } = newState.schema;
            const listNodeTypes = [nodes.bullet_list, nodes.ordered_list];
            const ids = new Set();
            const nodesToUpdate = [];
            newState.doc.descendants((node, pos) => {
                if (!('id' in node.attrs)) {
                    return true;
                }
                const { id } = node.attrs;
                if (id) {
                    if (ids.has(id)) {
                        const id = generateNodeID(node.type);
                        nodesToUpdate.push({ node, pos, id });
                        ids.add(id);
                    }
                    else {
                        ids.add(id);
                    }
                }
                else {
                    const id = generateNodeID(node.type);
                    nodesToUpdate.push({ node, pos, id });
                    ids.add(id);
                }
                if (listNodeTypes.includes(node.type)) {
                    return false;
                }
            });
            if (nodesToUpdate.length) {
                for (const { node, pos, id } of nodesToUpdate) {
                    tr.setNodeMarkup(pos, undefined, Object.assign({}, node.attrs, { id }));
                }
                return tr.setSelection(newState.selection);
            }
        },
    });
};
