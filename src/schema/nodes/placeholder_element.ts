import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
}

export interface PlaceholderElementNode extends ManuscriptNode {
  attrs: Attrs
}

export const placeholderElement: NodeSpec = {
  atom: true,
  selectable: false,
  attrs: {
    id: { default: '' },
  },
  group: 'block element',
  parseDOM: [
    {
      tag: 'div.placeholder-element',
      getAttrs: p => {
        const dom = p as HTMLDivElement

        return {
          id: dom.getAttribute('id'),
        }
      },
    },
  ],
  toDOM: node => {
    const placeholderElementNode = node as PlaceholderElementNode

    return [
      'div',
      {
        class: 'placeholder-element',
        id: placeholderElementNode.attrs.id,
      },
    ]
  },
}
