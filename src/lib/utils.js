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
import { isElementNode, } from '@manuscripts/manuscript-transform';
import { findParentNode } from 'prosemirror-utils';
export function* iterateChildren(node, recurse = false) {
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        yield child;
        if (recurse) {
            for (const grandchild of iterateChildren(child, true)) {
                yield grandchild;
            }
        }
    }
}
export const getMatchingChild = (parent, matcher) => {
    for (const node of iterateChildren(parent)) {
        if (matcher(node)) {
            return node;
        }
    }
};
export const getChildOfType = (parent, nodeType) => !!getMatchingChild(parent, node => node.type === nodeType);
export const findParentNodeWithId = findParentNode(node => 'id' in node.attrs);
export const findParentNodeWithIdValue = findParentNode(node => node.attrs.id);
export const findParentSection = findParentNode(node => node.type === node.type.schema.nodes.section);
export const findParentElement = findParentNode(node => isElementNode(node) && node.attrs.id);
