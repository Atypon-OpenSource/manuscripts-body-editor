import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  label: string
}

export interface PlaceholderNode extends ManuscriptNode {
  attrs: Attrs
}

export const placeholder: NodeSpec = {
  atom: true,
  selectable: false,
  attrs: {
    id: { default: '' },
    label: { default: '' },
  },
  group: 'block',
  parseDOM: [
    {
      tag: 'div.placeholder',
      getAttrs: p => {
        const dom = p as HTMLDivElement

        return {
          id: dom.getAttribute('id'),
        }
      },
    },
  ],
  toDOM: node => {
    const placeholderNode = node as PlaceholderNode

    return [
      'div',
      {
        class: 'placeholder-item',
        id: placeholderNode.attrs.id,
      },
    ]
  },
}
