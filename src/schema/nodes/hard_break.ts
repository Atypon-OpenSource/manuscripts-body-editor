import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

export interface HardBreakNode extends ManuscriptNode {
  attrs: {}
}

export const hardBreak: NodeSpec = {
  inline: true,
  group: 'inline',
  selectable: false,
  parseDOM: [{ tag: 'br' }],
  toDOM() {
    return ['br']
  },
}
