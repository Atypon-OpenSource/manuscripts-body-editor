import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  rid: string
  label: string
}

interface CrossReferenceNode extends ManuscriptNode {
  attrs: Attrs
}

export const crossReference: NodeSpec = {
  inline: true,
  group: 'inline',
  draggable: true,
  atom: true,
  attrs: {
    rid: { default: '' },
    label: { default: '' },
  },
  parseDOM: [
    {
      tag: 'span.cross-reference',
      getAttrs: p => {
        const dom = p as HTMLSpanElement

        return {
          rid: dom.getAttribute('data-reference-id'),
          label: dom.textContent,
        }
      },
    },
  ],
  toDOM: node => {
    const crossReferenceNode = node as CrossReferenceNode

    return [
      'span',
      {
        class: 'cross-reference',
        'data-reference-id': crossReferenceNode.attrs.rid,
      },
      [
        'span',
        {
          class: 'kind elementIndex',
        },
        ['b', crossReferenceNode.attrs.label],
      ],
    ]
  },
}
