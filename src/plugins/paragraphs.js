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
import { isParagraphNode, } from '@manuscripts/manuscript-transform';
import { Plugin } from 'prosemirror-state';
export default () => {
    return new Plugin({
        appendTransaction: (transactions, oldState, newState) => {
            let updated = 0;
            const tr = newState.tr;
            if (!transactions.some(transaction => transaction.docChanged))
                return null;
            const joinAdjacentParagraphs = (parent, pos) => (node, offset, index) => {
                const nodePos = pos + offset;
                if (isParagraphNode(node) &&
                    !node.childCount &&
                    index < parent.childCount - 1) {
                    const nextNode = parent.child(index + 1);
                    if (isParagraphNode(nextNode) && nextNode.childCount === 0) {
                        tr.join(nodePos + 2);
                        updated++;
                    }
                }
                node.forEach(joinAdjacentParagraphs(node, nodePos + 1));
            };
            newState.doc.forEach(joinAdjacentParagraphs(newState.doc, 0));
            if (updated) {
                return tr;
            }
        },
    });
};
