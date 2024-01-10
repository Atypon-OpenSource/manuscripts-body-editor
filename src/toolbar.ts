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
import { EditorState } from 'prosemirror-state'
import { ReactNode } from 'react'

import {
  addComment,
  blockActive,
  canInsert,
  Dispatch,
  insertBlock,
  insertInlineCitation,
  markActive,
} from './commands'
import icons from './icons'
import { skipCommandTracking } from './keys/list'

export interface ToolbarButtonConfig {
  title: string
  content: ReactNode
  isActive?: (state: EditorState) => boolean
  run: (state: EditorState, dispatch: Dispatch, attrs?: any) => void
  isEnabled: (state: EditorState) => boolean
  options?: {
    [key: string]: (state: EditorState, dispatch: Dispatch, attrs?: any) => void
  }
}

export interface ToolbarConfig {
  [key: string]: {
    [key: string]: ToolbarButtonConfig
  }
}

export const toolbar: ToolbarConfig = {
  style: {
    bold: {
      title: 'Toggle bold',
      content: icons.bold,
      isActive: markActive(schema.marks.bold),
      isEnabled: toggleMark(schema.marks.bold),
      run: toggleMark(schema.marks.bold),
    },
    italic: {
      title: 'Toggle italic',
      content: icons.italic,
      isActive: markActive(schema.marks.italic),
      isEnabled: toggleMark(schema.marks.italic),
      run: toggleMark(schema.marks.italic),
    },
    underline: {
      title: 'Toggle underline',
      content: icons.underline,
      isActive: markActive(schema.marks.underline),
      isEnabled: toggleMark(schema.marks.underline),
      run: toggleMark(schema.marks.underline),
    },
  },
  vertical: {
    subscript: {
      title: 'Toggle subscript',
      content: icons.subscript,
      isActive: markActive(schema.marks.subscript),
      isEnabled: toggleMark(schema.marks.subscript),
      run: toggleMark(schema.marks.subscript),
    },
    superscript: {
      title: 'Toggle superscript',
      content: icons.superscript,
      isActive: markActive(schema.marks.superscript),
      isEnabled: toggleMark(schema.marks.superscript),
      run: toggleMark(schema.marks.superscript),
    },
  },
  list: {
    bullet_list: {
      title: 'Wrap in bullet list',
      content: icons.bullet_list,
      isActive: blockActive(schema.nodes.bullet_list),
      isEnabled: wrapInList(schema.nodes.bullet_list),
      run: skipCommandTracking(wrapInList(schema.nodes.bullet_list)),
    },
    ordered_list: {
      title: 'Wrap in ordered list',
      content: icons.ordered_list,
      isActive: blockActive(schema.nodes.ordered_list),
      isEnabled: wrapInList(schema.nodes.ordered_list),
      run: skipCommandTracking(
        wrapInList(schema.nodes.ordered_list, {
          listStyleType: 'order',
        })
      ),
      options: {
        'order': skipCommandTracking(
          wrapInList(schema.nodes.ordered_list, {
            listStyleType: 'order',
          })
        ),
        'alpha-upper': skipCommandTracking(
          wrapInList(schema.nodes.ordered_list, {
            listStyleType: 'alpha-upper',
          })
        ),
        'alpha-lower': skipCommandTracking(
          wrapInList(schema.nodes.ordered_list, {
            listStyleType: 'alpha-lower',
          })
        ),
        'roman-upper': skipCommandTracking(
          wrapInList(schema.nodes.ordered_list, {
            listStyleType: 'roman-upper',
          })
        ),
        'roman-lower': skipCommandTracking(
          wrapInList(schema.nodes.ordered_list, {
            listStyleType: 'roman-lower',
          })
        ),
      },
    },
  },
  inline: {
    citation: {
      title: 'Insert citation',
      content: icons.citation,
      isEnabled: canInsert(schema.nodes.citation),
      run: insertInlineCitation,
    },
    comment: {
      title: 'Insert comment',
      content: icons.highlight,
      isEnabled: canInsert(schema.nodes.highlight_marker), // TODO: check both ends of selection
      run: addComment,
    },
  },
  element: {
    figure_element: {
      title: 'Insert figure',
      content: icons.figure_element,
      isEnabled: canInsert(schema.nodes.figure_element),
      run: insertBlock(schema.nodes.figure_element),
    },
    table_element: {
      title: 'Insert table',
      content: icons.table_element,
      isEnabled: canInsert(schema.nodes.table_element),
      run: insertBlock(schema.nodes.table_element),
    },
    equation_element: {
      title: 'Insert equation',
      content: icons.equation_element,
      isEnabled: canInsert(schema.nodes.equation_element),
      run: insertBlock(schema.nodes.equation_element),
    },
  },
}
