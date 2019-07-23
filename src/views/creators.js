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
export const createNodeView = (type) => (props) => (node, view, getPos) => {
    const nodeView = new type(props, node, view, getPos);
    nodeView.initialise();
    return nodeView;
};
export const createEditableNodeView = (type) => (props) => (node, view, getPos) => {
    const nodeView = new type(props, node, view, getPos);
    nodeView.initialise();
    return nodeView;
};
export const createNodeOrElementView = (type, tagName, callback) => (props) => (node, view, getPos, decorations) => {
    for (const decoration of decorations) {
        if (decoration.spec.element) {
            const nodeView = new type(props, node, view, getPos);
            nodeView.initialise();
            return nodeView;
        }
    }
    const dom = document.createElement(tagName);
    if (callback) {
        callback(node, dom);
    }
    const nodeView = {
        dom,
        contentDOM: dom,
    };
    return nodeView;
};
