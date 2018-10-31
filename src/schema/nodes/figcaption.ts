import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

export interface FigCaptionNode extends ManuscriptNode {
  attrs: {}
}

export const figcaption: NodeSpec = {
  content: 'inline*',
  group: 'block',
  isolating: true,
  parseDOM: [
    {
      tag: 'figcaption',
    },
  ],
  toDOM: () => ['figcaption', 0],
}
