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
import { toggleMark } from 'prosemirror-commands'
import { wrapInList } from 'prosemirror-schema-list'

import {
  addComment,
  blockActive,
  canInsert,
  insertBlock,
  insertInlineCitation,
  markActive,
} from './commands'
import { ToolbarConfig } from './components/toolbar/ManuscriptToolbar'
import { OrderListSelector } from './components/toolbar/OrderListSelector'
import icons from './icons'

export const toolbar: ToolbarConfig = {
  style: {
    bold: {
      title: 'Toggle bold',
      content: icons.bold,
      active: markActive(schema.marks.bold),
      enable: toggleMark(schema.marks.bold),
      run: toggleMark(schema.marks.bold),
    },
    italic: {
      title: 'Toggle italic',
      content: icons.italic,
      active: markActive(schema.marks.italic),
      enable: toggleMark(schema.marks.italic),
      run: toggleMark(schema.marks.italic),
    },
    underline: {
      title: 'Toggle underline',
      content: icons.underline,
      active: markActive(schema.marks.underline),
      enable: toggleMark(schema.marks.underline),
      run: toggleMark(schema.marks.underline),
    },
  },
  vertical: {
    subscript: {
      title: 'Toggle subscript',
      content: icons.subscript,
      active: markActive(schema.marks.subscript),
      enable: toggleMark(schema.marks.subscript),
      run: toggleMark(schema.marks.subscript),
    },
    superscript: {
      title: 'Toggle superscript',
      content: icons.superscript,
      active: markActive(schema.marks.superscript),
      enable: toggleMark(schema.marks.superscript),
      run: toggleMark(schema.marks.superscript),
    },
  },
  list: {
    bullet_list: {
      title: 'Wrap in bullet list',
      content: icons.bullet_list,
      active: blockActive(schema.nodes.bullet_list),
      enable: wrapInList(schema.nodes.bullet_list),
      run: wrapInList(schema.nodes.bullet_list),
    },
    ordered_list: {
      title: 'Wrap in ordered list',
      active: blockActive(schema.nodes.ordered_list),
      enable: wrapInList(schema.nodes.ordered_list),
      run: wrapInList(schema.nodes.ordered_list),
      Component: OrderListSelector,
    },
  },
  inline: {
    citation: {
      title: 'Insert citation',
      content: icons.citation,
      enable: canInsert(schema.nodes.citation),
      run: insertInlineCitation,
    },
    highlight: {
      title: 'Insert comment',
      content: icons.highlight,
      enable: canInsert(schema.nodes.highlight_marker), // TODO: check both ends of selection
      run: addComment,
    },
  },
  element: {
    figure_element: {
      title: 'Insert figure',
      content: icons.figure_element,
      enable: canInsert(schema.nodes.figure_element),
      run: insertBlock(schema.nodes.figure_element),
    },
    table_element: {
      title: 'Insert table',
      content: icons.table_element,
      enable: canInsert(schema.nodes.table_element),
      run: insertBlock(schema.nodes.table_element),
    },
    equation_element: {
      title: 'Insert equation',
      content: icons.equation_element,
      enable: canInsert(schema.nodes.equation_element),
      run: insertBlock(schema.nodes.equation_element),
    },
    listing_element: {
      title: 'Insert listing',
      content: icons.listing_element,
      enable: canInsert(schema.nodes.listing_element),
      run: insertBlock(schema.nodes.listing_element),
    },
  },
}
