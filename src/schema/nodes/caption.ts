import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  label: string
}

export interface CaptionNode extends ManuscriptNode {
  attrs: Attrs
}

export const caption: NodeSpec = {
  content: 'inline*',
  attrs: {
    id: { default: '' },
    label: { default: '' },
  },
  group: 'block',
  parseDOM: [
    {
      tag: 'caption',
    },
  ],
  toDOM: node => {
    const captionNode = node as CaptionNode

    return [
      'caption',
      {
        id: captionNode.attrs.id,
      },
      0,
    ]
  },
}
