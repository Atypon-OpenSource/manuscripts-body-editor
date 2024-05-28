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

import {
  AddCommentIcon,
  ToolbarBoldIcon,
  ToolbarCitationIcon,
  ToolbarEquationIcon,
  ToolbarFigureIcon,
  ToolbarItalicIcon,
  ToolbarOrderedListIcon,
  ToolbarSubscriptIcon,
  ToolbarSuperscriptIcon,
  ToolbarTableIcon,
  ToolbarUnderlineIcon,
  ToolbarUnorderedListIcon,
} from '@manuscripts/style-guide'
import { schema } from '@manuscripts/transform'
import { toggleMark } from 'prosemirror-commands'
import { EditorState } from 'prosemirror-state'
import React, { ReactNode } from 'react'

import {
  addComment,
  blockActive,
  canInsert,
  Dispatch,
  insertBlock,
  insertInlineCitation,
  insertList,
  markActive,
} from './commands'

export interface ToolbarButtonConfig {
  title: string
  content: ReactNode
  isActive?: (state: EditorState) => boolean
  run: (state: EditorState, dispatch: Dispatch) => void
  isEnabled: (state: EditorState) => boolean
  options?: {
    [key: string]: (state: EditorState, dispatch: Dispatch) => void
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
      content: <ToolbarBoldIcon />,
      isActive: markActive(schema.marks.bold),
      isEnabled: toggleMark(schema.marks.bold),
      run: toggleMark(schema.marks.bold),
    },
    italic: {
      title: 'Toggle italic',
      content: <ToolbarItalicIcon />,
      isActive: markActive(schema.marks.italic),
      isEnabled: toggleMark(schema.marks.italic),
      run: toggleMark(schema.marks.italic),
    },
    underline: {
      title: 'Toggle underline',
      content: <ToolbarUnderlineIcon />,
      isActive: markActive(schema.marks.underline),
      isEnabled: toggleMark(schema.marks.underline),
      run: toggleMark(schema.marks.underline),
    },
  },
  vertical: {
    subscript: {
      title: 'Toggle subscript',
      content: <ToolbarSubscriptIcon />,
      isActive: markActive(schema.marks.subscript),
      isEnabled: toggleMark(schema.marks.subscript),
      run: toggleMark(schema.marks.subscript),
    },
    superscript: {
      title: 'Toggle superscript',
      content: <ToolbarSuperscriptIcon />,
      isActive: markActive(schema.marks.superscript),
      isEnabled: toggleMark(schema.marks.superscript),
      run: toggleMark(schema.marks.superscript),
    },
  },
  list: {
    bullet_list: {
      title: 'Wrap in bullet list',
      content: <ToolbarUnorderedListIcon />,
      isActive: blockActive(schema.nodes.list),
      isEnabled: insertList(schema.nodes.list, 'bullet', 'bullet'),
      run: insertList(schema.nodes.list, 'bullet', 'bullet'),
      options: {
        bullet: insertList(schema.nodes.list, 'bullet', 'bullet'),
        simple: insertList(schema.nodes.list, 'bullet', 'simple'),
      },
    },
    ordered_list: {
      title: 'Wrap in ordered list',
      content: <ToolbarOrderedListIcon />,
      isActive: blockActive(schema.nodes.list),
      isEnabled: insertList(schema.nodes.list, 'order', 'order'),
      run: insertList(schema.nodes.list, 'order', 'order'),
      options: {
        order: insertList(schema.nodes.list, 'order'),
        'alpha-upper': insertList(schema.nodes.list, 'order', 'alpha-upper'),
        'alpha-lower': insertList(schema.nodes.list, 'order', 'alpha-lower'),
        'roman-upper': insertList(schema.nodes.list, 'order', 'roman-upper'),
        'roman-lower': insertList(schema.nodes.list, 'order', 'roman-lower'),
      },
    },
  },
  inline: {
    citation: {
      title: 'Insert citation',
      content: <ToolbarCitationIcon />,
      isEnabled: canInsert(schema.nodes.citation),
      run: insertInlineCitation,
    },
    comment: {
      title: 'Insert comment',
      content: <AddCommentIcon />,
      isEnabled: canInsert(schema.nodes.highlight_marker), // TODO: check both ends of selection
      run: addComment,
    },
  },
  element: {
    figure_element: {
      title: 'Insert figure',
      content: <ToolbarFigureIcon />,
      isEnabled: canInsert(schema.nodes.figure_element),
      run: insertBlock(schema.nodes.figure_element),
    },
    table_element: {
      title: 'Insert table',
      content: <ToolbarTableIcon />,
      isEnabled: canInsert(schema.nodes.table_element),
      run: insertBlock(schema.nodes.table_element),
    },
    equation_element: {
      title: 'Insert equation',
      content: <ToolbarEquationIcon />,
      isEnabled: canInsert(schema.nodes.equation_element),
      run: insertBlock(schema.nodes.equation_element),
    },
  },
}
