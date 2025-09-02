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

import { schema } from '@manuscripts/transform'
import {
  chainCommands,
  createParagraphNear,
  exitCode,
  joinBackward,
  joinDown,
  joinUp,
  lift,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
  toggleMark,
  wrapIn,
} from 'prosemirror-commands'
import { redo, undo } from 'prosemirror-history'
import { undoInputRule } from 'prosemirror-inputrules'
import { goToNextCell } from 'prosemirror-tables'

import {
  activateSearch,
  activateSearchReplace,
  addToStart,
  autoComplete,
  ignoreAtomBlockNodeBackward,
  ignoreAtomBlockNodeForward,
  ignoreEnterInSubtitles,
  ignoreMetaNodeBackspaceCommand,
  insertBlock,
  insertBreak,
  insertCrossReference,
  insertInlineCitation,
  insertInlineEquation,
  insertSection,
  selectAllIsolating,
} from '../commands'
import { EditorAction } from '../types'
import { skipCommandTracking } from './list'

const customKeymap: { [key: string]: EditorAction } = {
  Backspace: chainCommands(
    undoInputRule,
    ignoreAtomBlockNodeBackward,
    ignoreMetaNodeBackspaceCommand,
    skipCommandTracking(joinBackward)
  ),
  Delete: ignoreAtomBlockNodeForward,
  Tab: goToNextCell(1),
  'Mod-z': undo,
  'Mod-y': redo, // Mac
  'Shift-Mod-z': redo, // PC
  'Alt-ArrowUp': joinUp,
  'Alt-ArrowDown': joinDown,
  'Mod-BracketLeft': lift,
  'Mod-a': selectAllIsolating,
  'Mod-b': toggleMark(schema.marks.bold),
  'Mod-i': toggleMark(schema.marks.italic),
  'Shift-Mod-x': toggleMark(schema.marks.strikethrough),
  'Mod-u': toggleMark(schema.marks.underline),
  // 'Mod-`': toggleMark(schema.marks.code),
  'Mod-Alt-=': toggleMark(schema.marks.superscript),
  'Mod-Alt--': toggleMark(schema.marks.subscript),
  'Ctrl->': wrapIn(schema.nodes.blockquote),
  Enter: chainCommands(
    ignoreEnterInSubtitles,
    autoComplete,
    addToStart,
    newlineInCode,
    createParagraphNear,
    liftEmptyBlock,
    splitBlock
  ),
  'Shift-Mod-Enter': insertSection(true),
  'Mod-Enter': chainCommands(exitCode, insertSection()),
  'Shift-Enter': chainCommands(exitCode, insertBreak),
  'Ctrl-Enter': chainCommands(exitCode, insertBreak), // mac-only?
  // 'Shift-Ctrl-0': setBlockType(schema.nodes.paragraph),
  // 'Shift-Ctrl-\\': setBlockType(schema.nodes.listing_element),
  'Shift-Tab': goToNextCell(-1),
  'Mod-Alt-p': insertBlock(schema.nodes.figure_element),
  'Mod-Alt-t': insertBlock(schema.nodes.table_element),
  'Mod-Alt-l': insertBlock(schema.nodes.listing_element),
  'Mod-Alt-e': insertBlock(schema.nodes.equation_element),
  'Mod-Alt-c': insertInlineCitation,
  'Mod-Alt-r': insertCrossReference,
  'Shift-Mod-Alt-e': insertInlineEquation,
  'Shift-Ctrl-h': activateSearchReplace,
  'Shift-Mod-h': activateSearchReplace,
  'Mod-f': activateSearch,
  'Ctrl-f': activateSearch,
}

export default customKeymap
