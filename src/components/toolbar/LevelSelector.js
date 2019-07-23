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
import { generateNodeID, isSectionNode, nodeNames, } from '@manuscripts/manuscript-transform';
import { Fragment } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import React from 'react';
import Select from 'react-select';
import styled from 'styled-components';
import { findClosestParentElement } from '../../lib/hierarchy';
import { nodeTypeIcon } from '../../node-type-icons';
const optionName = (nodeType, depth) => {
    switch (nodeType) {
        case nodeType.schema.nodes.section:
            return 'sub'.repeat(depth - 1) + 'section heading';
        default:
            return nodeNames.get(nodeType) || nodeType.name;
    }
};
const titleCase = (text) => text.replace(/\b([a-z])/g, match => match.toUpperCase());
const buildOption = (props) => (Object.assign({}, props, { icon: nodeTypeIcon(props.nodeType), label: titleCase(optionName(props.nodeType, props.value)), isDisabled: Boolean(props.isDisabled), isSelected: Boolean(props.isSelected) }));
const buildOptions = (view) => {
    const { state: { doc, selection: { $from, $to }, schema, tr, }, } = view;
    const { nodes } = schema;
    if (!$from.sameParent($to)) {
        return [];
    }
    const parentElement = findClosestParentElement($from);
    if (!parentElement) {
        return [];
    }
    const moveParagraphToNewSubsection = () => {
        const paragraph = $from.node($from.depth);
        const beforeParagraph = $from.before($from.depth);
        const afterParagraph = $from.after($from.depth);
        const $afterParagraph = doc.resolve(afterParagraph);
        const afterParagraphOffset = $afterParagraph.parentOffset;
        const sectionDepth = $from.depth - 1;
        const parentSection = $from.node(sectionDepth);
        const endIndex = $from.indexAfter(sectionDepth);
        const sectionEnd = $from.end(sectionDepth);
        const textContent = paragraph.textContent;
        const sectionTitle = textContent
            ? nodes.section_title.create({}, schema.text(textContent))
            : nodes.section_title.create();
        let sectionContent = Fragment.from(sectionTitle);
        if (endIndex < parentSection.childCount) {
            sectionContent = sectionContent.append(parentSection.content.cut(afterParagraphOffset));
        }
        const newSection = nodes.section.create({
            id: generateNodeID(nodes.section),
        }, sectionContent);
        tr.replaceWith(beforeParagraph, sectionEnd, newSection);
        const anchor = beforeParagraph + 2;
        tr.setSelection(TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size));
        view.focus();
        view.dispatch(tr.scrollIntoView());
    };
    const moveSectionToSubsection = () => {
        const sectionTitle = $from.node();
        const sectionDepth = $from.depth - 1;
        const section = $from.node(sectionDepth);
        const beforeSection = $from.before(sectionDepth);
        const afterSection = $from.after(sectionDepth);
        const parentSectionDepth = $from.depth - 2;
        const parentSection = $from.node(parentSectionDepth);
        const startIndex = $from.index(parentSectionDepth);
        const previousSection = parentSection.child(startIndex - 1);
        const beforePreviousSection = beforeSection - previousSection.nodeSize;
        tr.replaceWith(beforePreviousSection, afterSection, previousSection.content.append(Fragment.from(section)));
        const anchor = beforeSection + 1;
        tr.setSelection(TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size));
        view.focus();
        view.dispatch(tr.scrollIntoView());
    };
    const promoteSection = (target) => () => {
        const sectionDepth = $from.depth - 1;
        const section = $from.node(sectionDepth);
        const beforeSection = $from.before(sectionDepth);
        const sectionTitle = $from.node($from.depth);
        const $beforeSection = doc.resolve(beforeSection);
        const beforeSectionOffset = $beforeSection.parentOffset;
        const afterSectionOffset = beforeSectionOffset + section.nodeSize;
        const parentSectionDepth = $from.depth - 2;
        const parentSection = $from.node(parentSectionDepth);
        const startIndex = $from.index(parentSectionDepth);
        const endIndex = $from.indexAfter(parentSectionDepth);
        const beforeParentSection = $from.before(parentSectionDepth);
        const afterParentSection = $from.after(parentSectionDepth);
        const items = [];
        let offset = 0;
        if (startIndex > 0) {
            const precedingSection = parentSection.cut(0, beforeSectionOffset);
            items.push(precedingSection);
            offset += precedingSection.nodeSize;
        }
        items.push(section);
        if (endIndex < parentSection.childCount) {
            const fragment = Fragment.from(nodes.section_title.create()).append(parentSection.content.cut(afterSectionOffset));
            items.push(parentSection.copy(fragment));
        }
        tr.replaceWith(beforeParentSection, afterParentSection, items);
        const anchor = beforeParentSection + offset + 2;
        tr.setSelection(TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size));
        view.focus();
        view.dispatch(tr.scrollIntoView());
    };
    const promoteParagraphToSection = (target) => () => {
        const paragraph = $from.node($from.depth);
        const beforeParagraph = $from.before($from.depth);
        const $beforeParagraph = doc.resolve(beforeParagraph);
        const beforeParagraphOffset = $beforeParagraph.parentOffset;
        const afterParagraphOffset = beforeParagraphOffset + paragraph.nodeSize;
        const sectionDepth = $from.depth - 1;
        const parentSection = $from.node(sectionDepth);
        const startIndex = $from.index(sectionDepth);
        const endIndex = $from.indexAfter(sectionDepth);
        const beforeParentSection = $from.before(sectionDepth);
        const afterParentSection = $from.after(sectionDepth);
        const items = [];
        let offset = 0;
        if (startIndex > 0) {
            const precedingSection = parentSection.cut(0, beforeParagraphOffset);
            items.push(precedingSection);
            offset += precedingSection.nodeSize;
        }
        const textContent = paragraph.textContent;
        const sectionTitle = textContent
            ? nodes.section_title.create({}, schema.text(textContent))
            : nodes.section_title.create();
        let sectionContent = Fragment.from(sectionTitle);
        if (endIndex < parentSection.childCount) {
            sectionContent = sectionContent.append(parentSection.content.cut(afterParagraphOffset));
        }
        else {
            sectionContent = sectionContent.append(Fragment.from(paragraph.copy()));
        }
        items.push(parentSection.copy(sectionContent));
        tr.replaceWith(beforeParentSection, afterParentSection, items);
        const anchor = beforeParentSection + offset + 2;
        tr.setSelection(TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size));
        view.focus();
        view.dispatch(tr.scrollIntoView());
    };
    const demoteSectionToParagraph = () => {
        const sectionTitle = $from.node($from.depth);
        const afterSectionTitle = $from.after($from.depth);
        const $afterSectionTitle = doc.resolve(afterSectionTitle);
        const afterSectionTitleOffset = $afterSectionTitle.parentOffset;
        const sectionDepth = $from.depth - 1;
        const section = $from.node(sectionDepth);
        const beforeSection = $from.before(sectionDepth);
        const afterSection = $from.after(sectionDepth);
        const $beforeSection = doc.resolve(beforeSection);
        const previousNode = $beforeSection.nodeBefore;
        const paragraph = nodes.paragraph.create({
            id: generateNodeID(nodes.paragraph),
        }, sectionTitle.content);
        let anchor;
        if (previousNode && isSectionNode(previousNode)) {
            tr.replaceWith(beforeSection - previousNode.nodeSize, afterSection, previousNode.copy(Fragment.from(previousNode.content)
                .append(Fragment.from(paragraph))
                .append(section.content.cut(afterSectionTitleOffset))));
            anchor = beforeSection;
        }
        else {
            tr.replaceWith(beforeSection, afterSection, Fragment.from(paragraph).append(section.content.cut(afterSectionTitleOffset)));
            anchor = beforeSection + 1;
        }
        tr.setSelection(TextSelection.create(tr.doc, anchor, anchor + paragraph.content.size));
        view.focus();
        view.dispatch(tr.scrollIntoView());
    };
    const convertParagraphToList = (nodeType) => () => {
        const paragraph = $from.node($from.depth);
        const beforeParagraph = $from.before($from.depth);
        const afterParagraph = $from.after($from.depth);
        const list = nodeType.create({
            id: generateNodeID(nodeType),
        }, nodes.list_item.create({}, schema.nodes.paragraph.create({}, paragraph.content)));
        tr.replaceWith(beforeParagraph, afterParagraph, list);
        const anchor = beforeParagraph + 3;
        tr.setSelection(TextSelection.create(tr.doc, anchor, anchor + paragraph.content.size));
        view.focus();
        view.dispatch(tr.scrollIntoView());
    };
    const convertListType = (nodeType, list) => () => {
        tr.setNodeMarkup(list.before, nodeType, list.node.attrs);
        view.focus();
        view.dispatch(tr.scrollIntoView());
    };
    const parentElementType = parentElement.node.type;
    switch (parentElementType) {
        case parentElementType.schema.nodes.section: {
            const sectionDepth = $from.depth - 1;
            const parentSectionDepth = sectionDepth - 1;
            const minimumDepth = Math.max(1, parentSectionDepth);
            const beforeSection = $from.before(sectionDepth);
            const $beforeSection = doc.resolve(beforeSection);
            const sectionOffset = $beforeSection.parentOffset;
            const typeOptions = [
                buildOption({
                    nodeType: nodes.paragraph,
                    value: -4,
                    depth: 1,
                    action: demoteSectionToParagraph,
                    isDisabled: sectionDepth <= 1 && sectionOffset <= 1,
                }),
                buildOption({
                    nodeType: nodes.ordered_list,
                    value: -3,
                    depth: 1,
                    isDisabled: true,
                }),
                buildOption({
                    nodeType: nodes.bullet_list,
                    value: -2,
                    depth: 1,
                    isDisabled: true,
                }),
            ];
            const sectionOptions = [];
            for (let depth = 1; depth < sectionDepth; depth++) {
                const node = $from.node(depth);
                if (isSectionNode(node)) {
                    sectionOptions.push(buildOption({
                        nodeType: nodes.section,
                        value: depth,
                        depth,
                        action: promoteSection(depth),
                        isDisabled: depth < minimumDepth,
                    }));
                }
            }
            sectionOptions.push(buildOption({
                nodeType: nodes.section,
                value: parentSectionDepth + 1,
                depth: parentSectionDepth + 1,
                isDisabled: true,
                isSelected: true,
            }));
            const parentSection = $from.node(parentSectionDepth);
            const beforeSectionPos = $from.before(parentSectionDepth + 1);
            const $beforeSectionPos = doc.resolve(beforeSectionPos);
            const precedingSections = [];
            parentSection.nodesBetween(0, $beforeSectionPos.parentOffset, node => {
                if (isSectionNode(node)) {
                    precedingSections.push(node);
                }
                return false;
            });
            if (precedingSections.length > 0) {
                sectionOptions.push(buildOption({
                    nodeType: nodes.section,
                    value: parentSectionDepth + 2,
                    depth: parentSectionDepth + 2,
                    action: moveSectionToSubsection,
                }));
            }
            return [{ options: typeOptions }, { options: sectionOptions }];
        }
        case parentElementType.schema.nodes.paragraph: {
            const sectionDepth = $from.depth - 1;
            const minimumDepth = Math.max(1, sectionDepth);
            let parentSectionDepth = 0;
            const typeOptions = [
                buildOption({
                    nodeType: nodes.paragraph,
                    value: -4,
                    depth: 1,
                    isDisabled: true,
                    isSelected: true,
                }),
                buildOption({
                    nodeType: nodes.ordered_list,
                    value: -3,
                    depth: 1,
                    action: convertParagraphToList(nodes.ordered_list),
                }),
                buildOption({
                    nodeType: nodes.bullet_list,
                    value: -2,
                    depth: 1,
                    action: convertParagraphToList(nodes.bullet_list),
                }),
            ];
            const sectionOptions = [];
            for (let depth = 1; depth <= sectionDepth; depth++) {
                const node = $from.node(depth);
                if (isSectionNode(node)) {
                    sectionOptions.push(buildOption({
                        nodeType: nodes.section,
                        value: depth,
                        depth,
                        action: promoteParagraphToSection(depth),
                        isDisabled: depth < minimumDepth,
                    }));
                    parentSectionDepth = depth;
                }
            }
            sectionOptions.push(buildOption({
                nodeType: nodes.section,
                value: parentSectionDepth + 1,
                depth: parentSectionDepth + 1,
                action: moveParagraphToNewSubsection,
            }));
            return [{ options: typeOptions }, { options: sectionOptions }];
        }
        case parentElementType.schema.nodes.bullet_list: {
            return [
                {
                    options: [
                        buildOption({
                            nodeType: parentElementType,
                            value: -4,
                            depth: 1,
                            isDisabled: true,
                            isSelected: true,
                        }),
                    ],
                },
                {
                    options: [
                        buildOption({
                            nodeType: nodes.ordered_list,
                            value: -3,
                            depth: 1,
                            action: convertListType(nodes.ordered_list, parentElement),
                        }),
                    ],
                },
            ];
        }
        case parentElementType.schema.nodes.ordered_list: {
            return [
                {
                    options: [
                        buildOption({
                            nodeType: parentElementType,
                            value: -4,
                            depth: 1,
                            isDisabled: true,
                            isSelected: true,
                        }),
                    ],
                },
                {
                    options: [
                        buildOption({
                            nodeType: nodes.bullet_list,
                            value: -3,
                            depth: 1,
                            action: convertListType(nodes.bullet_list, parentElement),
                        }),
                    ],
                },
            ];
        }
        default: {
            return [
                buildOption({
                    nodeType: parentElementType,
                    value: -3,
                    depth: 1,
                    isDisabled: true,
                    isSelected: true,
                }),
            ];
        }
    }
};
const OptionContainer = styled.div `
  display: flex;
  align-items: center;

  & svg path {
    fill: ${props => (props.isSelected ? '#fff' : '#7fb5d5')};
  }
`;
const OptionIcon = styled.span `
  display: inline-flex;
  width: 16px;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  flex-shrink: 0;
`;
const OptionLabel = styled.span `
  flex: 1;
`;
const Group = styled.div `
  &:not(:last-child) {
    border-bottom: 1px solid #ddd;
  }
`;
const StyledSelect = styled(Select) `
  z-index: 3;

  & > div:hover {
    border-color: #7fb5d5;
  }
`;
const findSelectedOption = (options) => {
    for (const group of options) {
        for (const option of group.options) {
            if (option.isSelected) {
                return option;
            }
        }
    }
};
export const LevelSelector = ({ view }) => {
    const { state: { schema: { nodes }, }, } = view;
    const options = buildOptions(view);
    return (React.createElement(StyledSelect, { isDisabled: options.length <= 1, isSearchable: false, options: options, value: options.length === 1
            ? options[0]
            : findSelectedOption(options), components: {
            Group: (props) => (React.createElement(Group, Object.assign({ ref: props.innerRef }, props.innerProps), props.children)),
            GroupHeading: () => null,
            Option: (props) => {
                const data = props.data;
                const style = props.getStyles('option', props);
                style.display = 'flex';
                style.fontSize = 15;
                style.cursor = 'pointer';
                style.paddingLeft = 8 + (data.depth - 1) * 16;
                style.minWidth = 200;
                if (data.nodeType === nodes.section) {
                    style.fontSize = Math.max(14, 23 - 3 * (data.value - 1));
                    style.fontWeight = 600;
                }
                if (props.isSelected) {
                    style.backgroundColor = '#7fb5d5';
                    style.color = '#fff';
                }
                else {
                    style.color = '#333';
                }
                if (props.isDisabled && !props.isSelected) {
                    style.opacity = 0.4;
                }
                return (React.createElement(OptionContainer, Object.assign({ ref: props.innerRef }, props.innerProps, { style: style, depth: data.value, isSelected: props.isSelected }),
                    React.createElement(OptionIcon, null, nodeTypeIcon(data.nodeType)),
                    React.createElement(OptionLabel, null, data.label)));
            },
        }, onChange: (value) => {
            if (value && value.action) {
                value.action();
            }
        }, styles: {
            control: (styles) => (Object.assign({}, styles, { backgroundColor: '#fff', borderWidth: 1, borderStyle: 'solid', borderColor: '#d6d6d6', boxShadow: 'none', fontSize: '14px', minHeight: 0, padding: 0, width: 200, overflowX: 'hidden', textOverflow: 'ellipsis' })),
            indicatorSeparator: () => ({
                display: 'none',
            }),
            dropdownIndicator: (styles) => (Object.assign({}, styles, { padding: '0 4px' })),
            menu: (styles) => (Object.assign({}, styles, { width: 'auto' })),
            singleValue: (styles) => (Object.assign({}, styles, { padding: 0 })),
            valueContainer: (styles) => (Object.assign({}, styles, { padding: '1px 8px' })),
            container: (styles) => (Object.assign({}, styles, { border: 'none' })),
        } }));
};
