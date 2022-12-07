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

import { ManuscriptSchema, schema } from '@manuscripts/manuscript-transform'
import { Command, toggleMark } from 'prosemirror-commands'
import { redo, undo } from 'prosemirror-history'
import { wrapInList } from 'prosemirror-schema-list'
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  deleteColumn,
  deleteRow,
  mergeCells,
  splitCell,
} from 'prosemirror-tables'

import {
  addComment,
  blockActive,
  canInsert,
  ifInTableBody,
  insertBibliographySection,
  insertBlock,
  insertCrossReference,
  insertGraphicalAbstract,
  // insertFootnotesSection, // this is disabled by commenting until we test the footnotes
  insertInlineCitation,
  insertInlineEquation,
  insertInlineFootnote,
  insertKeywordsSection,
  insertLink,
  insertSection,
  insertTOCSection,
  markActive,
} from './commands'
import { MenuSpec } from './components/application-menu'
import { DialogNames } from './components/dialog'
import {
  deleteClosestParentElement,
  findClosestParentElementNodeName,
} from './lib/hierarchy'
import useEditor from './useEditor'

export default (
  editor: ReturnType<typeof useEditor>,
  handleOpenDialog: (dialog: DialogNames) => void,
  footnotesEnabled?: boolean,
  contentEditable?: boolean
): MenuSpec[] => {
  const { isCommandValid, state } = editor
  const wrap = (command: Command<ManuscriptSchema>) => () =>
    editor.doCommand(command)

  let menus = [
    {
      id: 'edit',
      label: 'Edit',
      submenu: [
        {
          id: 'edit-undo',
          role: 'undo',
          label: 'Undo',
          accelerator: {
            mac: 'CommandOrControl+Z',
            pc: 'CommandOrControl+Z',
          },
          enable: isCommandValid(undo),
          run: wrap(undo),
        },
        {
          id: 'edit-redo',
          role: 'redo',
          label: 'Redo',
          accelerator: {
            mac: 'Shift+CommandOrControl+Z',
            pc: 'CommandOrControl+Y',
          },
          enable: isCommandValid(redo),
          run: wrap(redo),
        },
        {
          role: 'separator',
        },
        {
          id: 'edit-delete',
          role: 'delete',
          label: (() => {
            const nodeName = findClosestParentElementNodeName(state)

            return `Delete ${nodeName}`
          })(),
          enable: isCommandValid(deleteClosestParentElement),
          run: wrap(deleteClosestParentElement),
        },
      ],
    },
    {
      id: 'insert',
      label: 'Insert',
      submenu: [
        {
          id: 'insert-section',
          label: 'Section',
          accelerator: {
            mac: 'CommandOrControl+Enter',
            pc: 'CommandOrControl+Enter',
          },
          enable: isCommandValid(insertSection()),
          run: wrap(insertSection()),
        },
        {
          id: 'insert-graphical-abstract',
          label: 'Graphical Abstract',
          enable: isCommandValid(insertGraphicalAbstract),
          run: wrap(insertGraphicalAbstract),
        },
        {
          id: 'insert-subsection',
          label: 'Subsection',
          accelerator: {
            mac: 'Shift+CommandOrControl+Enter',
            pc: 'Shift+CommandOrControl+Enter',
          },
          enable: isCommandValid(insertSection(true)),
          run: wrap(insertSection(true)),
        },
        {
          id: 'insert-paragraph',
          label: 'Paragraph',
          // active: blockActive(schema.nodes.paragraph),
          enable: isCommandValid(canInsert(schema.nodes.paragraph)),
          run: wrap(insertBlock(schema.nodes.paragraph)),
        },
        {
          role: 'separator',
        },
        {
          id: 'insert-ordered-list',
          label: 'Numbered List',
          accelerator: {
            mac: 'Option+CommandOrControl+O',
            pc: 'CommandOrControl+Option+O',
          },
          // active: blockActive(schema.nodes.ordered_list),
          enable: isCommandValid(wrapInList(schema.nodes.ordered_list)),
          run: wrap(wrapInList(schema.nodes.ordered_list)),
        },
        {
          id: 'insert-bullet-list',
          label: 'Bullet List',
          accelerator: {
            mac: 'Option+CommandOrControl+K',
            pc: 'CommandOrControl+Option+K',
          },
          // active: blockActive(schema.nodes.bullet_list),
          enable: isCommandValid(wrapInList(schema.nodes.bullet_list)),
          run: wrap(wrapInList(schema.nodes.bullet_list)),
        },
        {
          role: 'separator',
        },
        {
          id: 'insert-blockquote',
          label: 'Block Quote',
          // active: blockActive(schema.nodes.blockquote_element),
          enable: isCommandValid(canInsert(schema.nodes.blockquote_element)),
          run: wrap(insertBlock(schema.nodes.blockquote_element)),
        },
        {
          id: 'insert-pullquote',
          label: 'Pull Quote',
          // active: blockActive(schema.nodes.pullquote_element),
          enable: isCommandValid(canInsert(schema.nodes.pullquote_element)),
          run: wrap(insertBlock(schema.nodes.pullquote_element)),
        },
        {
          role: 'separator',
        },
        {
          id: 'insert-figure-element',
          label: 'Figure Panel',
          accelerator: {
            mac: 'Option+CommandOrControl+P',
            pc: 'CommandOrControl+Option+P',
          },
          // active: blockActive(schema.nodes.figure_element),
          enable: isCommandValid(canInsert(schema.nodes.figure_element)),
          run: wrap(insertBlock(schema.nodes.figure_element)),
        },
        {
          id: 'insert-table-element',
          label: 'Table',
          accelerator: {
            mac: 'Option+CommandOrControl+T',
            pc: 'CommandOrControl+Option+T',
          },
          // active: blockActive(schema.nodes.table_element),
          enable: isCommandValid(canInsert(schema.nodes.table_element)),
          run: wrap(insertBlock(schema.nodes.table_element)),
        },
        {
          id: 'insert-listing',
          label: 'Listing',
          accelerator: {
            mac: 'Option+CommandOrControl+L',
            pc: 'CommandOrControl+Option+L',
          },
          // active: blockActive(schema.nodes.listing_element),
          enable: isCommandValid(canInsert(schema.nodes.listing_element)),
          run: wrap(insertBlock(schema.nodes.listing_element)),
        },
        {
          role: 'separator',
        },
        {
          id: 'insert-link',
          label: 'Link',
          accelerator: {
            mac: 'Option+CommandOrControl+H',
            pc: 'CommandOrControl+Option+H',
          },
          active: blockActive(schema.nodes.link)(state),
          enable: isCommandValid(canInsert(schema.nodes.link)),
          run: wrap(insertLink),
        },
        {
          role: 'separator',
        },
        {
          id: 'insert-equation',
          label: 'Equation',
          accelerator: {
            mac: 'Option+CommandOrControl+E',
            pc: 'CommandOrControl+Option+E',
          },
          // active: blockActive(schema.nodes.equation_element),
          enable: isCommandValid(canInsert(schema.nodes.equation_element)),
          run: wrap(insertBlock(schema.nodes.equation_element)),
        },
        {
          id: 'insert-inline-equation',
          label: 'Inline Equation',
          accelerator: {
            mac: 'Shift+Option+CommandOrControl+E',
            pc: 'Shift+CommandOrControl+Option+E',
          },
          // active: blockActive(schema.nodes.inline_equation),
          enable: isCommandValid(canInsert(schema.nodes.inline_equation)),
          run: wrap(insertInlineEquation),
        },
        {
          role: 'separator',
        },
        {
          id: 'insert-citation',
          label: 'Citation',
          accelerator: {
            mac: 'Option+CommandOrControl+C',
            pc: 'CommandOrControl+Option+C',
          },
          enable: isCommandValid(canInsert(schema.nodes.citation)),
          run: wrap(insertInlineCitation),
        },
        {
          id: 'insert-cross-reference',
          label: 'Cross-reference',
          accelerator: {
            mac: 'Option+CommandOrControl+R',
            pc: 'CommandOrControl+Option+R',
          },
          enable: isCommandValid(canInsert(schema.nodes.cross_reference)),
          run: wrap(insertCrossReference),
        },
        {
          id: 'insert-footnote',
          label: 'Footnote',
          accelerator: {
            mac: 'Option+CommandOrControl+F',
            pc: 'CommandOrControl+Option+F',
          },
          enable: isCommandValid(canInsert(schema.nodes.inline_footnote)),
          run: wrap(insertInlineFootnote('footnote')),
        },
        {
          id: 'insert-comment',
          label: 'Comment',
          enable: isCommandValid(addComment),
          run: wrap(addComment),
        },
        // endnote type is not used at the moment, this will be needed when we enable them
        // {
        //   id: 'insert-endnote',
        //   label: () => 'Endnote',
        //   accelerator: {
        //     mac: 'Option+CommandOrControl+E',
        //     pc: 'CommandOrControl+Option+E',
        //   },
        //   enable: canInsert(schema.nodes.inline_footnote),
        //   run: insertInlineFootnote('endnote'),
        // },
        {
          role: 'separator',
        },
        {
          id: 'insert-toc',
          label: 'Table of Contents',
          enable: isCommandValid(insertTOCSection),
          run: wrap(insertTOCSection),
        },
        {
          id: 'insert-keywords',
          label: 'Keywords',
          enable: isCommandValid(insertKeywordsSection),
          run: wrap(insertKeywordsSection),
        },
        {
          id: 'insert-bibliography',
          label: 'Bibliography',
          enable: isCommandValid(insertBibliographySection),
          run: wrap(insertBibliographySection),
        },
      ],
    },
    {
      id: 'format',
      label: 'Format',
      submenu: [
        {
          id: 'format-bold',
          label: 'Bold',
          accelerator: {
            mac: 'CommandOrControl+B',
            pc: 'CommandOrControl+B',
          },
          active: markActive(schema.marks.bold)(state),
          enable: isCommandValid(toggleMark(schema.marks.bold)),
          run: wrap(toggleMark(schema.marks.bold)),
        },
        {
          id: 'format-italic',
          label: 'Italic',
          accelerator: {
            mac: 'CommandOrControl+I',
            pc: 'CommandOrControl+I',
          },
          active: markActive(schema.marks.italic)(state),
          enable: isCommandValid(toggleMark(schema.marks.italic)),
          run: wrap(toggleMark(schema.marks.italic)),
        },
        {
          id: 'format-strikethrough',
          label: 'Strikethrough',
          accelerator: {
            mac: 'CommandOrControl+Shift+X',
            pc: 'CommandOrControl+Shift+X',
          },
          active: markActive(schema.marks.strikethrough)(state),
          enable: isCommandValid(toggleMark(schema.marks.strikethrough)),
          run: wrap(toggleMark(schema.marks.strikethrough)),
        },
        {
          id: 'format-underline',
          label: 'Underline',
          accelerator: {
            mac: 'CommandOrControl+U',
            pc: 'CommandOrControl+U',
          },
          active: markActive(schema.marks.underline)(state),
          enable: isCommandValid(toggleMark(schema.marks.underline)),
          run: wrap(toggleMark(schema.marks.underline)),
        },
        {
          role: 'separator',
        },
        {
          id: 'format-superscript',
          label: 'Superscript',
          accelerator: {
            mac: 'Option+CommandOrControl+=',
            pc: 'CommandOrControl+Option+=',
          },
          active: markActive(schema.marks.superscript)(state),
          enable: isCommandValid(toggleMark(schema.marks.superscript)),
          run: wrap(toggleMark(schema.marks.superscript)),
        },
        {
          id: 'format-subscript',
          label: 'Subscript',
          accelerator: {
            mac: 'Option+CommandOrControl+-',
            pc: 'CommandOrControl+Option+-',
          },
          active: markActive(schema.marks.subscript)(state),
          enable: isCommandValid(toggleMark(schema.marks.subscript)),
          run: wrap(toggleMark(schema.marks.subscript)),
        },
        {
          role: 'separator',
        },
        {
          id: 'format-table',
          label: 'Table',
          enable: isCommandValid(blockActive(schema.nodes.table)),
          submenu: [
            {
              id: 'format-table-add-row-before',
              label: 'Add Row Above',
              enable: isCommandValid(ifInTableBody(addRowBefore)),
              run: wrap(addRowBefore),
            },
            {
              id: 'format-table-add-row-after',
              label: 'Add Row Below',
              enable: isCommandValid(ifInTableBody(addRowAfter)),
              run: wrap(addRowAfter),
            },
            {
              id: 'format-table-delete-row',
              label: 'Delete Row',
              enable: isCommandValid(ifInTableBody(deleteRow)),
              run: wrap(deleteRow),
            },
            {
              role: 'separator',
            },
            {
              id: 'format-table-add-column-before',
              label: 'Add Column Before',
              enable: isCommandValid(addColumnBefore),
              run: wrap(addColumnBefore),
            },
            {
              id: 'format-table-add-column-after',
              label: 'Add Column After',
              enable: isCommandValid(addColumnAfter),
              run: wrap(addColumnAfter),
            },
            {
              id: 'format-table-delete-column',
              label: 'Delete Column',
              enable: isCommandValid(deleteColumn),
              run: wrap(deleteColumn),
            },
            {
              role: 'separator',
            },
            {
              id: 'merge-cells',
              label: 'Merge Cells',
              enable: isCommandValid(mergeCells),
              run: wrap(mergeCells),
            },
            {
              id: 'split-cells',
              label: 'Split Cell',
              enable: isCommandValid(splitCell),
              run: wrap(splitCell),
            },
            {
              id: 'table-options',
              label: 'Table options \u2026',
              run: () => handleOpenDialog(DialogNames.TableOptions),
              enable: isCommandValid(ifInTableBody(deleteRow)),
            },
            {
              id: 'style-table-cell',
              label: 'Cell style \u2026',
              run: () => handleOpenDialog(DialogNames.TableCellOptions),
              enable: isCommandValid(ifInTableBody(deleteRow)),
            },
            {
              id: 'style-table-cell-border',
              label: 'Border style \u2026',
              run: () => DialogNames.TableCellBorderOptions,
              enable: isCommandValid(ifInTableBody(deleteRow)),
            },
          ],
        },
      ],
    },
  ]

  const menusEditable = ['insert', 'edit']

  if (contentEditable === false) {
    menus = menus.filter(
      (item) => !(item.id && menusEditable.includes(item.id))
    )
  }

  // this is temporal. once footnotes are production ready this filtering will be removed and the function should return the menus array above
  return menus.map((menuGroup: MenuSpec) => {
    if (menuGroup.submenu) {
      menuGroup.submenu = menuGroup.submenu.filter(
        (submenu) => !(submenu.id == 'insert-footnote' && !footnotesEnabled)
      )
    }
    return menuGroup
  })
}
