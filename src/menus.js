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
import { schema } from '@manuscripts/manuscript-transform';
import { toggleMark } from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import { wrapInList } from 'prosemirror-schema-list';
import { addColumnAfter, addColumnBefore, addRowAfter, addRowBefore, deleteColumn, deleteRow, } from 'prosemirror-tables';
import { blockActive, canInsert, ifInTableBody, insertBibliographySection, insertBlock, insertCrossReference, insertInlineCitation, insertInlineEquation, insertLink, markActive, } from './commands';
import icons from './icons';
import { deleteClosestParentElement, findClosestParentElementNodeName, } from './lib/hierarchy';
export const menus = [
    {
        label: () => 'Edit',
        submenu: [
            {
                role: 'undo',
                label: () => 'Undo',
                accelerator: {
                    mac: 'CommandOrControl+Z',
                    pc: 'CommandOrControl+Z',
                },
                enable: undo,
                run: undo,
            },
            {
                role: 'redo',
                label: () => 'Redo',
                accelerator: {
                    mac: 'Shift+CommandOrControl+Z',
                    pc: 'Control+Y',
                },
                enable: redo,
                run: redo,
            },
            {
                role: 'separator',
            },
            {
                role: 'delete',
                label: state => {
                    const nodeName = findClosestParentElementNodeName(state);
                    return `Delete ${nodeName}`;
                },
                enable: state => Boolean(state.selection),
                run: deleteClosestParentElement,
            },
        ],
    },
    {
        label: () => 'Insert',
        submenu: [
            {
                label: () => 'Paragraph',
                enable: canInsert(schema.nodes.paragraph),
                run: insertBlock(schema.nodes.paragraph),
            },
            {
                role: 'separator',
            },
            {
                label: () => 'Numbered List',
                accelerator: {
                    mac: 'Option+CommandOrControl+O',
                    pc: 'CommandOrControl+Option+O',
                },
                icon: icons.ordered_list,
                enable: wrapInList(schema.nodes.ordered_list),
                run: wrapInList(schema.nodes.ordered_list),
            },
            {
                label: () => 'Bullet List',
                accelerator: {
                    mac: 'Option+CommandOrControl+K',
                    pc: 'CommandOrControl+Option+K',
                },
                icon: icons.bullet_list,
                enable: wrapInList(schema.nodes.bullet_list),
                run: wrapInList(schema.nodes.bullet_list),
            },
            {
                role: 'separator',
            },
            {
                label: () => 'Figure Panel',
                accelerator: {
                    mac: 'Option+CommandOrControl+P',
                    pc: 'CommandOrControl+Option+P',
                },
                icon: icons.figure_element,
                enable: canInsert(schema.nodes.figure_element),
                run: insertBlock(schema.nodes.figure_element),
            },
            {
                label: () => 'Table',
                accelerator: {
                    mac: 'Option+CommandOrControl+T',
                    pc: 'CommandOrControl+Option+T',
                },
                icon: icons.bullet_list,
                enable: canInsert(schema.nodes.table_element),
                run: insertBlock(schema.nodes.table_element),
            },
            {
                label: () => 'Listing',
                accelerator: {
                    mac: 'Option+CommandOrControl+L',
                    pc: 'CommandOrControl+Option+L',
                },
                icon: icons.bullet_list,
                enable: canInsert(schema.nodes.listing_element),
                run: insertBlock(schema.nodes.listing_element),
            },
            {
                role: 'separator',
            },
            {
                label: () => 'Link',
                accelerator: {
                    mac: 'Option+CommandOrControl+H',
                    pc: 'CommandOrControl+Option+H',
                },
                active: blockActive(schema.nodes.link),
                enable: canInsert(schema.nodes.link),
                run: insertLink,
            },
            {
                role: 'separator',
            },
            {
                label: () => 'Equation',
                accelerator: {
                    mac: 'Option+CommandOrControl+E',
                    pc: 'CommandOrControl+Option+E',
                },
                icon: icons.equation_element,
                enable: canInsert(schema.nodes.equation_element),
                run: insertBlock(schema.nodes.equation_element),
            },
            {
                label: () => 'Inline Equation',
                accelerator: {
                    mac: 'Shift+Option+CommandOrControl+E',
                    pc: 'Shift+CommandOrControl+Option+E',
                },
                icon: icons.inline_equation,
                enable: canInsert(schema.nodes.inline_equation),
                run: insertInlineEquation,
            },
            {
                role: 'separator',
            },
            {
                label: () => 'Citation',
                accelerator: {
                    mac: 'Option+CommandOrControl+C',
                    pc: 'CommandOrControl+Option+C',
                },
                icon: icons.citation,
                enable: canInsert(schema.nodes.citation),
                run: insertInlineCitation,
            },
            {
                label: () => 'Cross-reference',
                accelerator: {
                    mac: 'Option+CommandOrControl+R',
                    pc: 'CommandOrControl+Option+R',
                },
                icon: icons.citation,
                enable: canInsert(schema.nodes.cross_reference),
                run: insertCrossReference,
            },
            {
                role: 'separator',
            },
            {
                label: () => 'Bibliography',
                enable: insertBibliographySection,
                run: insertBibliographySection,
            },
        ],
    },
    {
        label: () => 'Format',
        submenu: [
            {
                label: () => 'Bold',
                accelerator: {
                    mac: 'CommandOrControl+B',
                    pc: 'CommandOrControl+B',
                },
                icon: icons.bold,
                active: markActive(schema.marks.bold),
                enable: toggleMark(schema.marks.bold),
                run: toggleMark(schema.marks.bold),
            },
            {
                label: () => 'Italic',
                accelerator: {
                    mac: 'CommandOrControl+I',
                    pc: 'CommandOrControl+I',
                },
                icon: icons.italic,
                active: markActive(schema.marks.italic),
                enable: toggleMark(schema.marks.italic),
                run: toggleMark(schema.marks.italic),
            },
            {
                label: () => 'Underline',
                accelerator: {
                    mac: 'CommandOrControl+U',
                    pc: 'CommandOrControl+U',
                },
                icon: icons.underline,
                active: markActive(schema.marks.underline),
                enable: toggleMark(schema.marks.underline),
                run: toggleMark(schema.marks.underline),
            },
            {
                role: 'separator',
            },
            {
                label: () => 'Superscript',
                accelerator: {
                    mac: 'Option+CommandOrControl+=',
                    pc: 'CommandOrControl+Option+=',
                },
                icon: icons.superscript,
                active: markActive(schema.marks.superscript),
                enable: toggleMark(schema.marks.superscript),
                run: toggleMark(schema.marks.superscript),
            },
            {
                label: () => 'Subscript',
                accelerator: {
                    mac: 'Option+CommandOrControl+-',
                    pc: 'CommandOrControl+Option+-',
                },
                icon: icons.subscript,
                active: markActive(schema.marks.subscript),
                enable: toggleMark(schema.marks.subscript),
                run: toggleMark(schema.marks.subscript),
            },
            {
                role: 'separator',
            },
            {
                label: () => 'Table',
                enable: blockActive(schema.nodes.table),
                submenu: [
                    {
                        label: () => 'Add Row Above',
                        enable: ifInTableBody(addRowBefore),
                        run: addRowBefore,
                    },
                    {
                        label: () => 'Add Row Below',
                        enable: ifInTableBody(addRowAfter),
                        run: addRowAfter,
                    },
                    {
                        label: () => 'Delete Row',
                        enable: ifInTableBody(deleteRow),
                        run: deleteRow,
                    },
                    {
                        role: 'separator',
                    },
                    {
                        label: () => 'Add Column Before',
                        enable: addColumnBefore,
                        run: addColumnBefore,
                    },
                    {
                        label: () => 'Add Column After',
                        enable: addColumnAfter,
                        run: addColumnAfter,
                    },
                    {
                        label: () => 'Delete Column',
                        enable: deleteColumn,
                        run: deleteColumn,
                    },
                ],
            },
        ],
    },
];
