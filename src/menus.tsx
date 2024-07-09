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

import { MenuSpec } from '@manuscripts/style-guide'
import { skipTracking } from '@manuscripts/track-changes-plugin'
import { schema } from '@manuscripts/transform'
import { toggleMark } from 'prosemirror-commands'
import { redo, undo } from 'prosemirror-history'
import { Command } from 'prosemirror-state'
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  deleteColumn,
  deleteRow,
} from 'prosemirror-tables'

import {
  addInlineComment,
  blockActive,
  canInsert,
  insertAbstract,
  insertBackMatterSection,
  insertBlock,
  insertContributors,
  insertCrossReference,
  insertGraphicalAbstract,
  insertInlineCitation,
  insertInlineEquation,
  insertInlineFootnote,
  insertKeywords,
  insertLink,
  insertList,
  insertSection,
  markActive,
} from './commands'
import {
  deleteClosestParentElement,
  findClosestParentElementNodeName,
} from './lib/hierarchy'
import { useEditor } from './useEditor'

export const getEditorMenus = (
  editor: ReturnType<typeof useEditor>
): MenuSpec[] => {
  const { isCommandValid, state } = editor
  const doCommand = (command: Command) => () => editor.doCommand(command)
  const doCommandWithoutTracking = (command: Command) => () => {
    editor.doCommand((state, dispatch) =>
      command(state, (tr) => dispatch && dispatch(skipTracking(tr)))
    )
  }

  const edit: MenuSpec = {
    id: 'edit',
    label: 'Edit',
    isEnabled: true,
    submenu: [
      {
        id: 'edit-undo',
        role: 'undo',
        label: 'Undo',
        shortcut: {
          mac: 'CommandOrControl+Z',
          pc: 'CommandOrControl+Z',
        },
        isEnabled: isCommandValid(undo),
        run: doCommand(undo),
      },
      {
        id: 'edit-redo',
        role: 'redo',
        label: 'Redo',
        shortcut: {
          mac: 'Shift+CommandOrControl+Z',
          pc: 'CommandOrControl+Y',
        },
        isEnabled: isCommandValid(redo),
        run: doCommand(redo),
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
        isEnabled: isCommandValid(deleteClosestParentElement),
        run: doCommand(deleteClosestParentElement),
      },
    ],
  }
  const insert: MenuSpec = {
    id: 'insert',
    label: 'Insert',
    isEnabled: true,
    submenu: [
      {
        id: 'front-matter',
        label: 'Article Metadata',
        isEnabled: true,
        submenu: [
          {
            id: 'insert-abstract',
            label: 'Abstract',
            isEnabled: isCommandValid(insertAbstract),
            run: doCommand(insertAbstract),
          },
          {
            id: 'insert-graphical-abstract',
            label: 'Graphical Abstract',
            isEnabled: isCommandValid(insertGraphicalAbstract),
            run: doCommand(insertGraphicalAbstract),
          },
          {
            id: 'insert-contributors',
            label: 'Authors & Affiliations',
            isEnabled: isCommandValid(insertContributors),
            run: doCommand(insertContributors),
          },
          {
            id: 'insert-keywords',
            label: 'Keywords',
            isEnabled: isCommandValid(insertKeywords),
            run: doCommand(insertKeywords),
          },
        ],
      },
      {
        id: 'back-matter',
        label: 'Author Notes',
        isEnabled: true,
        submenu: [
          {
            id: 'insert-acknowledgements',
            label: 'Acknowledgements',
            isEnabled: isCommandValid(
              insertBackMatterSection('MPSectionCategory:acknowledgement')
            ),
            run: doCommand(
              insertBackMatterSection('MPSectionCategory:acknowledgement')
            ),
          },
          {
            id: 'insert-availability',
            label: 'Availability',
            isEnabled: isCommandValid(
              insertBackMatterSection('MPSectionCategory:availability')
            ),
            run: doCommand(
              insertBackMatterSection('MPSectionCategory:availability')
            ),
          },
          {
            id: 'insert-coi-statement',
            label: 'COI Statement',
            isEnabled: isCommandValid(
              insertBackMatterSection('MPSectionCategory:competing-interests')
            ),
            run: doCommand(
              insertBackMatterSection('MPSectionCategory:competing-interests')
            ),
          },
          {
            id: 'insert-con',
            label: 'Contributed-by Information',
            isEnabled: isCommandValid(
              insertBackMatterSection('MPSectionCategory:con')
            ),
            run: doCommand(insertBackMatterSection('MPSectionCategory:con')),
          },
          {
            id: 'insert-ethics-statement',
            label: 'Ethics Statement',
            isEnabled: isCommandValid(
              insertBackMatterSection('MPSectionCategory:ethics-statement')
            ),
            run: doCommand(
              insertBackMatterSection('MPSectionCategory:ethics-statement')
            ),
          },
          {
            id: 'insert-financial-disclosure',
            label: 'Financial Disclosure',
            isEnabled: isCommandValid(
              insertBackMatterSection('MPSectionCategory:financial-disclosure')
            ),
            run: doCommand(
              insertBackMatterSection('MPSectionCategory:financial-disclosure')
            ),
          },
          {
            id: 'insert-supplementary-material',
            label: 'Supplementary Material',
            isEnabled: isCommandValid(
              insertBackMatterSection(
                'MPSectionCategory:supplementary-material'
              )
            ),
            run: doCommand(
              insertBackMatterSection(
                'MPSectionCategory:supplementary-material'
              )
            ),
          },
          {
            id: 'insert-supported-by',
            label: 'Supported By',
            isEnabled: isCommandValid(
              insertBackMatterSection('MPSectionCategory:supported-by')
            ),
            run: doCommand(
              insertBackMatterSection('MPSectionCategory:supported-by')
            ),
          },
        ],
      },
      {
        id: 'insert-section',
        label: 'Section',
        shortcut: {
          mac: 'CommandOrControl+Enter',
          pc: 'CommandOrControl+Enter',
        },
        isEnabled: isCommandValid(insertSection()),
        run: doCommand(insertSection()),
      },
      {
        id: 'insert-subsection',
        label: 'Subsection',
        shortcut: {
          mac: 'Shift+CommandOrControl+Enter',
          pc: 'Shift+CommandOrControl+Enter',
        },
        isEnabled: isCommandValid(insertSection(true)),
        run: doCommand(insertSection(true)),
      },
      {
        id: 'insert-paragraph',
        label: 'Paragraph',
        isEnabled: isCommandValid(canInsert(schema.nodes.paragraph)),
        run: doCommand(insertBlock(schema.nodes.paragraph)),
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-blockquote',
        label: 'Block Quote',
        isEnabled: isCommandValid(canInsert(schema.nodes.blockquote_element)),
        run: doCommand(insertBlock(schema.nodes.blockquote_element)),
      },
      {
        id: 'insert-pullquote',
        label: 'Pull Quote',
        isEnabled: isCommandValid(canInsert(schema.nodes.pullquote_element)),
        run: doCommand(insertBlock(schema.nodes.pullquote_element)),
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-figure-element',
        label: 'Figure Panel',
        shortcut: {
          mac: 'Option+CommandOrControl+P',
          pc: 'CommandOrControl+Option+P',
        },
        isEnabled: isCommandValid(canInsert(schema.nodes.figure_element)),
        run: doCommand(insertBlock(schema.nodes.figure_element)),
      },
      {
        id: 'insert-table-element',
        label: 'Table',
        shortcut: {
          mac: 'Option+CommandOrControl+T',
          pc: 'CommandOrControl+Option+T',
        },
        isEnabled: isCommandValid(canInsert(schema.nodes.table_element)),
        run: doCommand(insertBlock(schema.nodes.table_element)),
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-link',
        label: 'Link',
        shortcut: {
          mac: 'Option+CommandOrControl+H',
          pc: 'CommandOrControl+Option+H',
        },
        isActive: blockActive(schema.nodes.link)(state),
        isEnabled: isCommandValid(canInsert(schema.nodes.link)),
        run: doCommand(insertLink),
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-equation',
        label: 'Equation',
        shortcut: {
          mac: 'Option+CommandOrControl+E',
          pc: 'CommandOrControl+Option+E',
        },
        isEnabled: isCommandValid(canInsert(schema.nodes.equation_element)),
        run: doCommand(insertBlock(schema.nodes.equation_element)),
      },
      {
        id: 'insert-inline-equation',
        label: 'Inline Equation',
        shortcut: {
          mac: 'Shift+Option+CommandOrControl+E',
          pc: 'Shift+CommandOrControl+Option+E',
        },
        isEnabled: isCommandValid(canInsert(schema.nodes.inline_equation)),
        run: doCommand(insertInlineEquation),
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-citation',
        label: 'Citation',
        shortcut: {
          mac: 'Option+CommandOrControl+C',
          pc: 'CommandOrControl+Option+C',
        },
        isEnabled: isCommandValid(canInsert(schema.nodes.citation)),
        run: doCommand(insertInlineCitation),
      },
      {
        id: 'insert-cross-reference',
        label: 'Cross-reference',
        shortcut: {
          mac: 'Option+CommandOrControl+R',
          pc: 'CommandOrControl+Option+R',
        },
        isEnabled: isCommandValid(canInsert(schema.nodes.cross_reference)),
        run: doCommand(insertCrossReference),
      },
      {
        id: 'insert-footnote',
        label: 'Footnote',
        shortcut: {
          mac: 'Option+CommandOrControl+F',
          pc: 'CommandOrControl+Option+F',
        },
        isEnabled: isCommandValid(canInsert(schema.nodes.inline_footnote)),
        run: doCommand(insertInlineFootnote('footnote')),
      },
      {
        id: 'insert-comment',
        label: 'Comment',
        isEnabled: isCommandValid(addInlineComment),
        run: doCommand(addInlineComment),
      },
    ],
  }
  const format: MenuSpec = {
    id: 'format',
    label: 'Format',
    isEnabled: true,
    submenu: [
      {
        id: 'format-bold',
        label: 'Bold',
        shortcut: {
          mac: 'CommandOrControl+B',
          pc: 'CommandOrControl+B',
        },
        isActive: markActive(schema.marks.bold)(state),
        isEnabled: isCommandValid(toggleMark(schema.marks.bold)),
        run: doCommand(toggleMark(schema.marks.bold)),
      },
      {
        id: 'format-italic',
        label: 'Italic',
        shortcut: {
          mac: 'CommandOrControl+I',
          pc: 'CommandOrControl+I',
        },
        isActive: markActive(schema.marks.italic)(state),
        isEnabled: isCommandValid(toggleMark(schema.marks.italic)),
        run: doCommand(toggleMark(schema.marks.italic)),
      },
      {
        id: 'format-strikethrough',
        label: 'Strikethrough',
        shortcut: {
          mac: 'CommandOrControl+Shift+X',
          pc: 'CommandOrControl+Shift+X',
        },
        isActive: markActive(schema.marks.strikethrough)(state),
        isEnabled: isCommandValid(toggleMark(schema.marks.strikethrough)),
        run: doCommand(toggleMark(schema.marks.strikethrough)),
      },
      {
        id: 'format-underline',
        label: 'Underline',
        shortcut: {
          mac: 'CommandOrControl+U',
          pc: 'CommandOrControl+U',
        },
        isActive: markActive(schema.marks.underline)(state),
        isEnabled: isCommandValid(toggleMark(schema.marks.underline)),
        run: doCommand(toggleMark(schema.marks.underline)),
      },
      {
        role: 'separator',
      },
      {
        id: 'format-superscript',
        label: 'Superscript',
        shortcut: {
          mac: 'Option+CommandOrControl+=',
          pc: 'CommandOrControl+Option+=',
        },
        isActive: markActive(schema.marks.superscript)(state),
        isEnabled: isCommandValid(toggleMark(schema.marks.superscript)),
        run: doCommand(toggleMark(schema.marks.superscript)),
      },
      {
        id: 'format-subscript',
        label: 'Subscript',
        shortcut: {
          mac: 'Option+CommandOrControl+-',
          pc: 'CommandOrControl+Option+-',
        },
        isActive: markActive(schema.marks.subscript)(state),
        isEnabled: isCommandValid(toggleMark(schema.marks.subscript)),
        run: doCommand(toggleMark(schema.marks.subscript)),
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-bullet-list',
        label: 'Bullet List',
        isEnabled: isCommandValid(insertList(schema.nodes.list, 'bullet')),
        submenu: [
          {
            id: 'bullet-list-context-menu',
            label: '',
            isEnabled: true,
            options: {
              bullet: doCommand(insertList(schema.nodes.list, 'bullet')),
              simple: doCommand(insertList(schema.nodes.list, 'simple')),
            },
          },
        ],
      },
      {
        id: 'insert-ordered-list',
        label: 'Ordered List',
        isEnabled: isCommandValid(insertList(schema.nodes.list, 'order')),
        submenu: [
          {
            id: 'ordered-list-context-menu',
            label: '',
            isEnabled: true,
            options: {
              order: doCommand(insertList(schema.nodes.list, 'order')),
              'alpha-upper': doCommand(
                insertList(schema.nodes.list, 'alpha-upper')
              ),
              'alpha-lower': doCommand(
                insertList(schema.nodes.list, 'alpha-lower')
              ),
              'roman-upper': doCommand(
                insertList(schema.nodes.list, 'roman-upper')
              ),
              'roman-lower': doCommand(
                insertList(schema.nodes.list, 'roman-lower')
              ),
            },
          },
        ],
      },
      {
        role: 'separator',
      },
      {
        id: 'format-table',
        label: 'Table',
        isEnabled: isCommandValid(blockActive(schema.nodes.table)),
        submenu: [
          {
            id: 'format-table-add-row-before',
            label: 'Add Row Above',
            isEnabled: isCommandValid(addRowBefore),
            run: doCommand(addRowBefore),
          },
          {
            id: 'format-table-add-row-after',
            label: 'Add Row Below',
            isEnabled: isCommandValid(addRowAfter),
            run: doCommand(addRowAfter),
          },
          {
            id: 'format-table-delete-row',
            label: 'Delete Row',
            isEnabled: isCommandValid(deleteRow),
            run: doCommand(deleteRow),
          },
          {
            role: 'separator',
          },
          {
            id: 'format-table-add-column-before',
            label: 'Add Column Before',
            isEnabled: isCommandValid(addColumnBefore),
            run: doCommandWithoutTracking(addColumnBefore),
          },
          {
            id: 'format-table-add-column-after',
            label: 'Add Column After',
            isEnabled: isCommandValid(addColumnAfter),
            run: doCommandWithoutTracking(addColumnAfter),
          },
          {
            id: 'format-table-delete-column',
            label: 'Delete Column',
            isEnabled: isCommandValid(deleteColumn),
            run: doCommandWithoutTracking(deleteColumn),
          },
        ],
      },
    ],
  }

  return [edit, insert, format]
}
