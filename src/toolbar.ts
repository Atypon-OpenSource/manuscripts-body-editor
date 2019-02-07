import { toggleMark } from 'prosemirror-commands'
import { wrapInList } from 'prosemirror-schema-list'
import {
  blockActive,
  canInsert,
  insertBlock,
  insertInlineCitation,
  markActive,
} from './commands'
import { ToolbarConfig } from './components/toolbar/ManuscriptToolbar'
import icons from './icons'
import { schema } from './schema'
import { ManuscriptSchema } from './schema/types'

export const toolbar: ToolbarConfig<ManuscriptSchema> = {
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
      content: icons.ordered_list,
      active: blockActive(schema.nodes.ordered_list),
      enable: wrapInList(schema.nodes.ordered_list),
      run: wrapInList(schema.nodes.ordered_list),
    },
  },
  inline: {
    citation: {
      title: 'Insert citation',
      content: icons.citation,
      enable: canInsert(schema.nodes.citation),
      run: insertInlineCitation,
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
