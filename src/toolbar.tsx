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
  FileImageIcon,
  LinkIcon,
  OutlineBlockQuoteIcon,
  OutlineEmbedIcon,
  OutlinePullQuoteIcon,
  ToolbarBoldIcon,
  ToolbarBoxedTextIcon,
  ToolbarCitationIcon,
  ToolbarEquationIcon,
  ToolbarFigureIcon,
  ToolbarIndentIcon,
  ToolbarItalicIcon,
  ToolbarOrderedListIcon,
  ToolbarSpecialCharactersIcon,
  ToolbarSubscriptIcon,
  ToolbarSuperscriptIcon,
  ToolbarTableIcon,
  ToolbarUnderlineIcon,
  ToolbarUnindentIcon,
  ToolbarUnorderedListIcon,
} from '@manuscripts/style-guide'
import { schema } from '@manuscripts/transform'
import { toggleMark } from 'prosemirror-commands'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React, { ReactNode } from 'react'

import {
  addInlineComment,
  blockActive,
  canInsert,
  Dispatch,
  insertBlock,
  insertEmbed,
  insertInlineCitation,
  insertLink,
  insertList,
  markActive,
} from './commands'
import {
  changeIndentation,
  isIndentationAllowed,
} from './components/toolbar/helpers'
import { openInsertTableDialog } from './components/toolbar/InsertTableDialog'
import { openInsertSpecialCharacterDialog } from './components/views/InsertSpecialCharacter'
import { isEditAllowed } from './lib/utils'

export interface ToolbarButtonConfig {
  title: string
  content: ReactNode
  isActive?: (state: EditorState) => boolean
  run: (state: EditorState, dispatch: Dispatch, view?: EditorView) => void
  isEnabled: (state: EditorState) => boolean
  options?: {
    [key: string]: (
      state: EditorState,
      dispatch: Dispatch,
      view?: EditorView
    ) => void
  }
}

const isEnabled =
  (isCommandEnabled: (state: EditorState) => boolean) =>
  (state: EditorState) => {
    return isEditAllowed(state) && isCommandEnabled(state)
  }

export interface ToolbarConfig {
  [key: string]: {
    [key: string]: ToolbarButtonConfig
  }
}

export const toolbar: ToolbarConfig = {
  indentation: {
    indent: {
      title: 'Indent',
      content: <ToolbarIndentIcon />,
      isEnabled: isEnabled(isIndentationAllowed('indent')),
      run: changeIndentation('indent'),
    },
    unindent: {
      title: 'Unindent',
      content: <ToolbarUnindentIcon />,
      isEnabled: isEnabled(isIndentationAllowed('unindent')),
      run: changeIndentation('unindent'),
    },
  },
  style: {
    bold: {
      title: 'Toggle bold',
      content: <ToolbarBoldIcon />,
      isActive: markActive(schema.marks.bold),
      isEnabled: isEnabled(toggleMark(schema.marks.bold)),
      run: toggleMark(schema.marks.bold),
    },
    italic: {
      title: 'Toggle italic',
      content: <ToolbarItalicIcon />,
      isActive: markActive(schema.marks.italic),
      isEnabled: isEnabled(toggleMark(schema.marks.italic)),
      run: toggleMark(schema.marks.italic),
    },
    underline: {
      title: 'Toggle underline',
      content: <ToolbarUnderlineIcon />,
      isActive: markActive(schema.marks.underline),
      isEnabled: isEnabled(toggleMark(schema.marks.underline)),
      run: toggleMark(schema.marks.underline),
    },
  },
  vertical: {
    subscript: {
      title: 'Toggle subscript',
      content: <ToolbarSubscriptIcon />,
      isActive: markActive(schema.marks.subscript),
      isEnabled: isEnabled(toggleMark(schema.marks.subscript)),
      run: toggleMark(schema.marks.subscript),
    },
    superscript: {
      title: 'Toggle superscript',
      content: <ToolbarSuperscriptIcon />,
      isActive: markActive(schema.marks.superscript),
      isEnabled: isEnabled(toggleMark(schema.marks.superscript)),
      run: toggleMark(schema.marks.superscript),
    },
  },
  list: {
    bullet_list: {
      title: 'Bulleted list',
      content: <ToolbarUnorderedListIcon />,
      isActive: blockActive(schema.nodes.list),
      isEnabled: isEnabled(insertList(schema.nodes.list, 'bullet')),
      run: insertList(schema.nodes.list, 'bullet'),
      options: {
        bullet: insertList(schema.nodes.list, 'bullet'),
        simple: insertList(schema.nodes.list, 'simple'),
      },
    },
    ordered_list: {
      title: 'Ordered list',
      content: <ToolbarOrderedListIcon />,
      isActive: blockActive(schema.nodes.list),
      isEnabled: isEnabled(insertList(schema.nodes.list, 'order')),
      run: insertList(schema.nodes.list, 'order'),
      options: {
        order: insertList(schema.nodes.list, 'order'),
        'alpha-upper': insertList(schema.nodes.list, 'alpha-upper'),
        'alpha-lower': insertList(schema.nodes.list, 'alpha-lower'),
        'roman-upper': insertList(schema.nodes.list, 'roman-upper'),
        'roman-lower': insertList(schema.nodes.list, 'roman-lower'),
      },
    },
  },
  inline: {
    comment: {
      title: 'Insert comment',
      content: <AddCommentIcon />,
      isEnabled: isEnabled(canInsert(schema.nodes.highlight_marker)), // TODO: check both ends of selection
      run: addInlineComment,
    },
    citation: {
      title: 'Insert citation',
      content: <ToolbarCitationIcon />,
      isEnabled: isEnabled(canInsert(schema.nodes.citation)),
      run: insertInlineCitation,
    },
  },
  quote: {
    blockquote: {
      title: 'Insert blockquote',
      content: <OutlineBlockQuoteIcon />,
      isEnabled: isEnabled(canInsert(schema.nodes.blockquote_element)),
      run: insertBlock(schema.nodes.blockquote_element),
    },
    pullquote: {
      title: 'Insert pullquote',
      content: <OutlinePullQuoteIcon />,
      isEnabled: isEnabled(canInsert(schema.nodes.pullquote_element)),
      run: insertBlock(schema.nodes.pullquote_element),
    },
  },
  element: {
    figure_element: {
      title: 'Insert figure',
      content: <ToolbarFigureIcon />,
      isEnabled: isEnabled(canInsert(schema.nodes.figure_element)),
      run: insertBlock(schema.nodes.figure_element),
    },
    image_element: {
      title: 'Insert image',
      content: <FileImageIcon width="19" height="16" />,
      isEnabled: isEnabled(canInsert(schema.nodes.image_element)),
      run: insertBlock(schema.nodes.image_element),
    },
    table_element: {
      title: 'Insert table',
      content: <ToolbarTableIcon />,
      isEnabled: isEnabled(canInsert(schema.nodes.table_element)),
      run: openInsertTableDialog,
    },
    box_element: {
      title: 'Insert boxed text',
      content: <ToolbarBoxedTextIcon />,
      isEnabled: isEnabled(canInsert(schema.nodes.box_element)),
      run: insertBlock(schema.nodes.box_element),
    },
    equation_element: {
      title: 'Insert equation',
      content: <ToolbarEquationIcon />,
      isEnabled: isEnabled(canInsert(schema.nodes.equation_element)),
      run: insertBlock(schema.nodes.equation_element),
    },
  },
  media: {
    embed: {
      title: 'Insert media',
      content: <OutlineEmbedIcon />,
      isEnabled: isEnabled(canInsert(schema.nodes.embed)),
      run: insertEmbed,
    },
    link: {
      title: 'Insert link',
      content: <LinkIcon />,
      isEnabled: isEnabled(canInsert(schema.nodes.link)),
      run: insertLink,
    },
  },
  special: {
    special_characters: {
      title: 'Insert special characters',
      content: <ToolbarSpecialCharactersIcon />,
      isEnabled: isEnabled(canInsert(schema.nodes.text)),
      run: (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
        openInsertSpecialCharacterDialog(view)
      },
    },
  },
}
