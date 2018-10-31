import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  suppressCaption: boolean
}

export interface EquationElementNode extends ManuscriptNode {
  attrs: Attrs
}

export const equationElement: NodeSpec = {
  content: '(equation | placeholder) figcaption',
  attrs: {
    id: { default: '' },
    suppressCaption: { default: true },
  },
  selectable: false,
  group: 'block element',
  parseDOM: [
    {
      tag: 'figure.equation',
      getAttrs: p => {
        const dom = p as HTMLElement

        return {
          id: dom.getAttribute('id'),
        }
      },
    },
  ],
  toDOM: node => {
    const equationElementNode = node as EquationElementNode

    return [
      'figure',
      {
        class: 'equation', // TODO: suppress-caption?
        id: equationElementNode.attrs.id,
      },
      0,
    ]
  },
}
