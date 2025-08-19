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
import {
  getGroupCategories,
  schema,
  SectionCategory,
} from '@manuscripts/transform'
import { toggleMark } from 'prosemirror-commands'
import { redo, undo } from 'prosemirror-history'
import { Command } from 'prosemirror-state'

import {
  activateSearchReplace,
  addInlineComment,
  blockActive,
  canInsert,
  insertAbstractSection,
  insertAffiliation,
  insertAward,
  insertBackmatterSection,
  insertBlock,
  insertBoxElement,
  insertContributors,
  insertCrossReference,
  insertEmbed,
  insertGraphicalAbstract,
  insertHeroImage,
  insertInlineCitation,
  insertInlineEquation,
  insertInlineFootnote,
  insertKeywords,
  insertLink,
  insertList,
  insertSection,
  markActive,
} from './commands'
import { openInsertTableDialog } from './components/toolbar/InsertTableDialog'
import { ListMenuItem } from './components/toolbar/ListMenuItem'
import { openInsertSpecialCharacterDialog } from './components/views/InsertSpecialCharacter'
import {
  deleteClosestParentElement,
  findClosestParentElementNodeName,
} from './lib/hierarchy'
import { isEditAllowed } from './lib/utils'
import { getEditorProps } from './plugins/editor-props'
import { useEditor } from './useEditor'

export const getEditorMenus = (
  editor: ReturnType<typeof useEditor>
): MenuSpec[] => {
  const { isCommandValid, state } = editor
  const doCommand = (command: Command) => () => editor.doCommand(command)
  const props = getEditorProps(state)

  const insertBackmatterSectionMenu = (category: SectionCategory) => {
    const command = insertBackmatterSection(category)
    return {
      id: `insert-${category.id}`,
      label: category.titles[0],
      isEnabled: isCommandValid(command),
      run: doCommand(command),
    }
  }

  const insertAbstractsSectionMenu = (category: SectionCategory) => {
    const command =
      category.group === 'abstracts-graphic'
        ? insertGraphicalAbstract(category)
        : insertAbstractSection(category)

    return {
      id: `insert-${category.id}`,
      label: category.titles[0],
      isEnabled: isCommandValid(command),
      run: doCommand(command),
    }
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
        isEnabled:
          isEditAllowed(state) && isCommandValid(deleteClosestParentElement),
        run: doCommand(deleteClosestParentElement),
      },
      {
        role: 'separator',
      },
      {
        id: 'find-replace',
        role: 'find-replace',
        label: 'Find and replace',
        shortcut: {
          mac: 'CommandOrControl+Shift+H',
          pc: 'CommandOrControl+Shift+H',
        },
        isEnabled: isCommandValid(activateSearchReplace),
        run: doCommand(activateSearchReplace),
      },
    ],
  }

  const categories = getGroupCategories(props.sectionCategories, 'backmatter')
  const abstractsCategories = getGroupCategories(
    props.sectionCategories,
    'abstracts'
  )
  const graphicalAbstractsCategories = getGroupCategories(
    props.sectionCategories,
    'abstracts-graphic'
  )
  const allAbstractsCategories = [
    ...abstractsCategories,
    ...graphicalAbstractsCategories,
  ]
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
            id: 'insert-abstract-types',
            label: 'Abstract Types',
            isEnabled: true,
            submenu: allAbstractsCategories.map(insertAbstractsSectionMenu),
          },
          {
            id: 'insert-contributors',
            label: 'Authors',
            isEnabled: isCommandValid(insertContributors),
            run: doCommand(insertContributors),
            isHidden: props.hiddenNodeTypes?.includes(
              schema.nodes.contributors
            ),
          },
          {
            id: 'insert-contributors',
            label: 'Affiliations',
            isEnabled: isCommandValid(insertAffiliation),
            run: doCommand(insertAffiliation),
            isHidden: props.hiddenNodeTypes?.includes(
              schema.nodes.affiliations
            ),
          },
          {
            id: 'insert-awards',
            label: 'Funder Information',
            isEnabled: isCommandValid(insertAward),
            run: doCommand(insertAward),
            isHidden: props.hiddenNodeTypes?.includes(schema.nodes.awards),
          },
          {
            id: 'insert-keywords',
            label: 'Keywords',
            isEnabled: isCommandValid(insertKeywords),
            run: doCommand(insertKeywords),
            isHidden: props.hiddenNodeTypes?.includes(schema.nodes.keywords),
          },
        ],
      },
      {
        id: 'back-matter',
        label: 'Author Notes',
        isEnabled: true,
        submenu: categories.map(insertBackmatterSectionMenu),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.author_notes),
      },
      {
        id: 'insert-section',
        label: 'Section',
        shortcut: {
          mac: 'CommandOrControl+Enter',
          pc: 'CommandOrControl+Enter',
        },
        isEnabled: isEditAllowed(state) && isCommandValid(insertSection()),
        run: doCommand(insertSection()),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.section),
      },
      {
        id: 'insert-subsection',
        label: 'Subsection',
        shortcut: {
          mac: 'Shift+CommandOrControl+Enter',
          pc: 'Shift+CommandOrControl+Enter',
        },
        isEnabled: isEditAllowed(state) && isCommandValid(insertSection(true)),
        run: doCommand(insertSection(true)),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.section),
      },
      {
        id: 'insert-paragraph',
        label: 'Paragraph',
        isEnabled:
          isEditAllowed(state) &&
          isCommandValid(canInsert(schema.nodes.paragraph)),
        run: doCommand(insertBlock(schema.nodes.paragraph)),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.paragraph),
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-blockquote',
        label: 'Block Quote',
        isEnabled:
          isEditAllowed(state) &&
          isCommandValid(canInsert(schema.nodes.blockquote_element)),
        run: doCommand(insertBlock(schema.nodes.blockquote_element)),
        isHidden: props.hiddenNodeTypes?.includes(
          schema.nodes.blockquote_element
        ),
      },
      {
        id: 'insert-pullquote',
        label: 'Pull Quote',
        isEnabled:
          isEditAllowed(state) &&
          isCommandValid(canInsert(schema.nodes.pullquote_element)),
        run: doCommand(insertBlock(schema.nodes.pullquote_element)),
        isHidden: props.hiddenNodeTypes?.includes(
          schema.nodes.pullquote_element
        ),
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-boxed-text',
        label: 'Boxed Text',
        shortcut: {
          mac: 'Option+CommandOrControl+B',
          pc: 'CommandOrControl+Option+B',
        },
        isEnabled:
          isEditAllowed(state) &&
          isCommandValid(canInsert(schema.nodes.box_element)),
        run: doCommand(insertBoxElement),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.box_element),
      },
      {
        id: 'insert-figure-element',
        label: 'Figure Panel',
        shortcut: {
          mac: 'Option+CommandOrControl+P',
          pc: 'CommandOrControl+Option+P',
        },
        isEnabled:
          isEditAllowed(state) &&
          isCommandValid(canInsert(schema.nodes.figure_element)),
        run: doCommand(insertBlock(schema.nodes.figure_element)),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.figure_element),
      },
      {
        id: 'insert-image-element',
        label: 'Simple Image',
        isEnabled:
          isEditAllowed(state) &&
          isCommandValid(canInsert(schema.nodes.image_element)),
        run: doCommand(insertBlock(schema.nodes.image_element)),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.image_element),
      },
      {
        id: 'insert-hero-image',
        label: 'Hero Image',
        isEnabled: isEditAllowed(state) && isCommandValid(insertHeroImage()),
        run: doCommand(insertHeroImage()),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.hero_image),
      },
      {
        id: 'insert-table-element',
        label: 'Table',
        shortcut: {
          mac: 'Option+CommandOrControl+T',
          pc: 'CommandOrControl+Option+T',
        },
        isEnabled:
          isEditAllowed(state) &&
          isCommandValid(canInsert(schema.nodes.table_element)),
        run: () => openInsertTableDialog(editor.state, editor.dispatch),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.table_element),
      },
      {
        role: 'separator',
      },
      {
        id: 'insert-embed-media',
        label: 'Embedded Media',
        isActive: blockActive(schema.nodes.embed)(state),
        isEnabled:
          isEditAllowed(state) && isCommandValid(canInsert(schema.nodes.embed)),
        run: doCommand(insertEmbed),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.embed),
      },
      {
        id: 'insert-link',
        label: 'Link',
        shortcut: {
          mac: 'Option+CommandOrControl+H',
          pc: 'CommandOrControl+Option+H',
        },
        isActive: blockActive(schema.nodes.link)(state),
        isEnabled:
          isEditAllowed(state) && isCommandValid(canInsert(schema.nodes.link)),
        run: doCommand(insertLink),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.link),
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
        isEnabled:
          isEditAllowed(state) &&
          isCommandValid(canInsert(schema.nodes.equation_element)),
        run: doCommand(insertBlock(schema.nodes.equation_element)),
        isHidden: props.hiddenNodeTypes?.includes(
          schema.nodes.equation_element
        ),
      },
      {
        id: 'insert-inline-equation',
        label: 'Inline Equation',
        shortcut: {
          mac: 'Shift+Option+CommandOrControl+E',
          pc: 'Shift+CommandOrControl+Option+E',
        },
        isEnabled:
          isEditAllowed(state) &&
          isCommandValid(canInsert(schema.nodes.inline_equation)),
        run: doCommand(insertInlineEquation),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.inline_equation),
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
        isEnabled:
          isEditAllowed(state) &&
          isCommandValid(canInsert(schema.nodes.citation)),
        run: doCommand(insertInlineCitation),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.citation),
      },
      {
        id: 'insert-cross-reference',
        label: 'Cross-reference',
        shortcut: {
          mac: 'Option+CommandOrControl+R',
          pc: 'CommandOrControl+Option+R',
        },
        isEnabled:
          isEditAllowed(state) &&
          isCommandValid(canInsert(schema.nodes.cross_reference)),
        run: doCommand(insertCrossReference),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.cross_reference),
      },
      {
        id: 'insert-footnote',
        label: 'Footnote',
        shortcut: {
          mac: 'Option+CommandOrControl+F',
          pc: 'CommandOrControl+Option+F',
        },
        isEnabled:
          isEditAllowed(state) &&
          isCommandValid(canInsert(schema.nodes.inline_footnote)),
        run: doCommand(insertInlineFootnote),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.inline_footnote),
      },
      {
        id: 'insert-special-character',
        label: 'Special Characters',
        isEnabled:
          isEditAllowed(state) && isCommandValid(canInsert(schema.nodes.text)),
        run: () => openInsertSpecialCharacterDialog(editor.view),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.text),
      },
      {
        id: 'insert-comment',
        label: 'Comment',
        isEnabled: isEditAllowed(state) && isCommandValid(addInlineComment),
        run: doCommand(addInlineComment),
        isHidden: props.hiddenNodeTypes?.includes(schema.nodes.comment),
      },
    ],
  }
  const format: MenuSpec = {
    id: 'format',
    label: 'Format',
    isEnabled: isEditAllowed(state),
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
        label: 'Bulleted list',
        component: ListMenuItem,
        isEnabled: isCommandValid(insertList(schema.nodes.list, 'bullet')),
        submenu: [
          {
            id: 'bullet',
            label: 'Bullet',
            isEnabled: true,
            run: doCommand(insertList(schema.nodes.list, 'bullet')),
          },
          {
            id: 'simple',
            label: 'Simple',
            isEnabled: true,
            run: doCommand(insertList(schema.nodes.list, 'simple')),
          },
        ],
      },
      {
        id: 'insert-ordered-list',
        label: 'Ordered list',
        component: ListMenuItem,
        isEnabled: isCommandValid(insertList(schema.nodes.list, 'order')),
        submenu: [
          {
            id: 'order',
            label: 'Order',
            isEnabled: true,
            run: doCommand(insertList(schema.nodes.list, 'order')),
          },
          {
            id: 'alpha-upper',
            label: 'Alpha upper',
            isEnabled: true,
            run: doCommand(insertList(schema.nodes.list, 'alpha-upper')),
          },
          {
            id: 'alpha-lower',
            label: 'Alpha lower',
            isEnabled: true,
            run: doCommand(insertList(schema.nodes.list, 'alpha-lower')),
          },
          {
            id: 'roman-upper',
            label: 'Roman upper',
            isEnabled: true,
            run: doCommand(insertList(schema.nodes.list, 'roman-upper')),
          },
          {
            id: 'roman-lower',
            label: 'Roman lower',
            isEnabled: true,
            run: doCommand(insertList(schema.nodes.list, 'roman-lower')),
          },
        ],
      },
    ],
  }

  return [edit, insert, format]
}
