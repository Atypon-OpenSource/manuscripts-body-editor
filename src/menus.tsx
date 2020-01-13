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

import { schema } from '@manuscripts/manuscript-transform'
import { toggleMark } from 'prosemirror-commands'
import { redo, undo } from 'prosemirror-history'
import { wrapInList } from 'prosemirror-schema-list'
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  deleteColumn,
  deleteRow,
} from 'prosemirror-tables'
import {
  blockActive,
  canInsert,
  ifInTableBody,
  insertBibliographySection,
  insertBlock,
  insertCrossReference,
  insertInlineCitation,
  insertInlineEquation,
  insertKeywordsSection,
  insertLink,
  markActive,
} from './commands'
import { MenuItem } from './components/menu/ApplicationMenu'
import {
  deleteClosestParentElement,
  findClosestParentElementNodeName,
} from './lib/hierarchy'

export const menus: MenuItem[] = [
  {
    id: 'edit',
    label: () => 'Edit',
    submenu: [
      {
        id: 'edit-undo',
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
        id: 'edit-redo',
        role: 'redo',
        label: () => 'Redo',
        accelerator: {
          mac: 'Shift+CommandOrControl+Z',
          pc: 'CommandOrControl+Y',
        },
        enable: redo,
        run: redo,
      },
      {
        role: 'separator',
      },
      {
        id: 'edit-delete',
        role: 'delete',
        label: state => {
          const nodeName = findClosestParentElementNodeName(state)

          return `Delete ${nodeName}`
        },
        enable: state => Boolean(state.selection),
        run: deleteClosestParentElement,
      },
    ],
  },
  {
    id: 'insert',
    label: () => 'Insert',
    submenu: [
      {
        id: 'insert-paragraph',
        label: () => 'Paragraph',
        // active: blockActive(schema.nodes.paragraph),
        enable: canInsert(schema.nodes.paragraph),
        run: insertBlock(schema.nodes.paragraph),
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-ordered-list',
        label: () => 'Numbered List',
        accelerator: {
          mac: 'Option+CommandOrControl+O',
          pc: 'CommandOrControl+Option+O',
        },
        // active: blockActive(schema.nodes.ordered_list),
        enable: wrapInList(schema.nodes.ordered_list),
        run: wrapInList(schema.nodes.ordered_list),
      },
      {
        id: 'insert-bullet-list',
        label: () => 'Bullet List',
        accelerator: {
          mac: 'Option+CommandOrControl+K',
          pc: 'CommandOrControl+Option+K',
        },
        // active: blockActive(schema.nodes.bullet_list),
        enable: wrapInList(schema.nodes.bullet_list),
        run: wrapInList(schema.nodes.bullet_list),
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-figure-element',
        label: () => 'Figure Panel',
        accelerator: {
          mac: 'Option+CommandOrControl+P',
          pc: 'CommandOrControl+Option+P',
        },
        // active: blockActive(schema.nodes.figure_element),
        enable: canInsert(schema.nodes.figure_element),
        run: insertBlock(schema.nodes.figure_element),
      },
      {
        id: 'insert-table-element',
        label: () => 'Table',
        accelerator: {
          mac: 'Option+CommandOrControl+T',
          pc: 'CommandOrControl+Option+T',
        },
        // active: blockActive(schema.nodes.table_element),
        enable: canInsert(schema.nodes.table_element),
        run: insertBlock(schema.nodes.table_element),
      },
      {
        id: 'insert-listing',
        label: () => 'Listing',
        accelerator: {
          mac: 'Option+CommandOrControl+L',
          pc: 'CommandOrControl+Option+L',
        },
        // active: blockActive(schema.nodes.listing_element),
        enable: canInsert(schema.nodes.listing_element),
        run: insertBlock(schema.nodes.listing_element),
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-link',
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
        id: 'insert-equation',
        label: () => 'Equation',
        accelerator: {
          mac: 'Option+CommandOrControl+E',
          pc: 'CommandOrControl+Option+E',
        },
        // active: blockActive(schema.nodes.equation_element),
        enable: canInsert(schema.nodes.equation_element),
        run: insertBlock(schema.nodes.equation_element),
      },
      {
        id: 'insert-inline-equation',
        label: () => 'Inline Equation',
        accelerator: {
          mac: 'Shift+Option+CommandOrControl+E',
          pc: 'Shift+CommandOrControl+Option+E',
        },
        // active: blockActive(schema.nodes.inline_equation),
        enable: canInsert(schema.nodes.inline_equation),
        run: insertInlineEquation,
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-citation',
        label: () => 'Citation',
        accelerator: {
          mac: 'Option+CommandOrControl+C',
          pc: 'CommandOrControl+Option+C',
        },
        enable: canInsert(schema.nodes.citation),
        run: insertInlineCitation,
      },
      {
        id: 'insert-cross-reference',
        label: () => 'Cross-reference',
        accelerator: {
          mac: 'Option+CommandOrControl+R',
          pc: 'CommandOrControl+Option+R',
        },
        enable: canInsert(schema.nodes.cross_reference),
        run: insertCrossReference,
      },
      // {
      //   id: 'insert-footnote',
      //   label: 'Footnote',
      //   accelerator: {
      //     mac: 'Option+CommandOrControl+F',
      //     pc: 'CommandOrControl+Option+F',
      //   },
      //   enable: canInsert(schema.nodes.inline_footnote),
      //   run: insertInlineFootnote,
      // },
      {
        role: 'separator',
      },
      {
        id: 'insert-keywords',
        label: () => 'Keywords',
        enable: insertKeywordsSection,
        run: insertKeywordsSection,
      },
      {
        id: 'insert-bibliography',
        label: () => 'Bibliography',
        enable: insertBibliographySection,
        run: insertBibliographySection,
      },
    ],
  },
  {
    id: 'format',
    label: () => 'Format',
    submenu: [
      {
        id: 'format-bold',
        label: () => 'Bold',
        accelerator: {
          mac: 'CommandOrControl+B',
          pc: 'CommandOrControl+B',
        },
        active: markActive(schema.marks.bold),
        enable: toggleMark(schema.marks.bold),
        run: toggleMark(schema.marks.bold),
      },
      {
        id: 'format-italic',
        label: () => 'Italic',
        accelerator: {
          mac: 'CommandOrControl+I',
          pc: 'CommandOrControl+I',
        },
        active: markActive(schema.marks.italic),
        enable: toggleMark(schema.marks.italic),
        run: toggleMark(schema.marks.italic),
      },
      {
        id: 'format-strikethrough',
        label: () => 'Strikethrough',
        accelerator: {
          mac: 'CommandOrControl+Shift+X',
          pc: 'CommandOrControl+Shift+X',
        },
        active: markActive(schema.marks.strikethrough),
        enable: toggleMark(schema.marks.strikethrough),
        run: toggleMark(schema.marks.strikethrough),
      },
      {
        id: 'format-underline',
        label: () => 'Underline',
        accelerator: {
          mac: 'CommandOrControl+U',
          pc: 'CommandOrControl+U',
        },
        active: markActive(schema.marks.underline),
        enable: toggleMark(schema.marks.underline),
        run: toggleMark(schema.marks.underline),
      },
      {
        role: 'separator',
      },
      {
        id: 'format-superscript',
        label: () => 'Superscript',
        accelerator: {
          mac: 'Option+CommandOrControl+=',
          pc: 'CommandOrControl+Option+=',
        },
        active: markActive(schema.marks.superscript),
        enable: toggleMark(schema.marks.superscript),
        run: toggleMark(schema.marks.superscript),
      },
      {
        id: 'format-subscript',
        label: () => 'Subscript',
        accelerator: {
          mac: 'Option+CommandOrControl+-',
          pc: 'CommandOrControl+Option+-',
        },
        active: markActive(schema.marks.subscript),
        enable: toggleMark(schema.marks.subscript),
        run: toggleMark(schema.marks.subscript),
      },
      {
        role: 'separator',
      },
      {
        id: 'format-table',
        label: () => 'Table',
        enable: blockActive(schema.nodes.table),
        submenu: [
          {
            id: 'format-table-add-row-before',
            label: () => 'Add Row Above',
            enable: ifInTableBody(addRowBefore),
            run: addRowBefore,
          },
          {
            id: 'format-table-add-row-after',
            label: () => 'Add Row Below',
            enable: ifInTableBody(addRowAfter),
            run: addRowAfter,
          },
          {
            id: 'format-table-delete-row',
            label: () => 'Delete Row',
            enable: ifInTableBody(deleteRow),
            run: deleteRow,
          },
          {
            role: 'separator',
          },
          {
            id: 'format-table-add-column-before',
            label: () => 'Add Column Before',
            enable: addColumnBefore,
            run: addColumnBefore,
          },
          {
            id: 'format-table-add-column-after',
            label: () => 'Add Column After',
            enable: addColumnAfter,
            run: addColumnAfter,
          },
          {
            id: 'format-table-delete-column',
            label: () => 'Delete Column',
            enable: deleteColumn,
            run: deleteColumn,
          },
        ],
      },
    ],
  },
]
