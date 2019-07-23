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
import { parse } from '@manuscripts/title-editor';
import React from 'react';
import { debounceRender } from '../DebounceRender';
import DraggableTree, { buildTree } from './DraggableTree';
const ManuscriptOutline = ({ doc, manuscript, selected, view, }) => {
    if (!doc || !view)
        return null;
    const { items } = buildTree({ node: doc, pos: 0, index: 0, selected });
    const node = parse(manuscript.title || '');
    const tree = {
        node,
        requirementsNode: doc,
        pos: 0,
        endPos: 0,
        index: 0,
        isSelected: !selected,
        items,
    };
    return React.createElement(DraggableTree, { tree: tree, view: view });
};
export const DebouncedManuscriptOutlineContainer = debounceRender(ManuscriptOutline, 500, {
    leading: true,
});
