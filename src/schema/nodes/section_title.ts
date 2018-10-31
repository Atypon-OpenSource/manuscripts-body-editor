import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

export interface SectionTitleNode extends ManuscriptNode {
  attrs: {}
}

export const sectionTitle: NodeSpec = {
  content: 'text*',
  marks: 'italic superscript subscript smallcaps',
  group: 'block',
  selectable: false,
  parseDOM: [
    {
      tag: 'h1',
    },
    {
      tag: 'h2',
    },
    {
      tag: 'h3',
    },
    {
      tag: 'h4',
    },
    {
      tag: 'h5',
    },
    {
      tag: 'h6',
    },
  ],
  toDOM: () => ['h1', 0],
}
