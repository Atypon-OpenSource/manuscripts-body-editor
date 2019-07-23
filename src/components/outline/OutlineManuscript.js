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
import OutlineIconManuscript from '@manuscripts/assets/react/OutlineIconManuscript';
import { nodeTitlePlaceholder } from '@manuscripts/manuscript-transform';
import { parse, schema } from '@manuscripts/title-editor';
import React from 'react';
import { Outline, OutlineItem, OutlineItemArrow, OutlineItemIcon, OutlineItemLink, OutlineItemLinkText, OutlineItemPlaceholder, StyledTriangleCollapsed, } from './Outline';
const titleText = (value) => {
    const node = parse(value, {
        topNode: schema.nodes.title.create(),
    });
    return node.textContent;
};
export const OutlineManuscript = ({ project, manuscript, }) => (React.createElement(Outline, null,
    React.createElement(OutlineItem, { isSelected: false, depth: 0 },
        React.createElement(OutlineItemLink, { to: `/projects/${project._id}/manuscripts/${manuscript._id}` },
            React.createElement(OutlineItemArrow, null,
                React.createElement(StyledTriangleCollapsed, null)),
            React.createElement(OutlineItemIcon, null,
                React.createElement(OutlineIconManuscript, null)),
            React.createElement(OutlineItemLinkText, { className: 'outline-text-title' }, manuscript.title ? (titleText(manuscript.title)) : (React.createElement(OutlineItemPlaceholder, null, nodeTitlePlaceholder(schema.nodes.title))))))));
