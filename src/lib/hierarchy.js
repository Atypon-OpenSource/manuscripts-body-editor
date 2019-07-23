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
import { isElementNode, isListNode, isSectionNode, nodeNames, } from '@manuscripts/manuscript-transform';
export const findListParent = ($pos) => {
    for (let depth = $pos.depth; depth > 0; depth--) {
        const node = $pos.node(depth);
        if (isListNode(node)) {
            return {
                node,
                before: $pos.before(depth),
                after: $pos.after(depth),
            };
        }
    }
};
export const findClosestParentElement = ($pos) => {
    const listParent = findListParent($pos);
    if (listParent) {
        return listParent;
    }
    for (let depth = $pos.depth; depth > 0; depth--) {
        const node = $pos.node(depth);
        if (isSectionNode(node) || isElementNode(node)) {
            return {
                node,
                before: $pos.before(depth),
                after: $pos.after(depth),
            };
        }
    }
};
export const findClosestParentElementNodeName = (state) => {
    if (state.selection) {
        const fromParentElement = findClosestParentElement(state.selection.$from);
        const toParentElement = findClosestParentElement(state.selection.$to);
        if (fromParentElement && toParentElement) {
            if (fromParentElement.node === toParentElement.node) {
                const nodeName = nodeNames.get(fromParentElement.node.type);
                if (nodeName) {
                    return nodeName;
                }
            }
        }
    }
    return '';
};
export const deleteClosestParentElement = (state, dispatch) => {
    if (state.selection) {
        const fromParentElement = findClosestParentElement(state.selection.$from);
        const toParentElement = findClosestParentElement(state.selection.$to);
        if (dispatch) {
            if (fromParentElement && toParentElement) {
                dispatch(state.tr.delete(fromParentElement.before, toParentElement.after));
            }
        }
    }
};
