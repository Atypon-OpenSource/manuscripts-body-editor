import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

type Kind = 'footnote' | 'endnote'

const placeholderText: { [key in Kind]: string } = {
  endnote: 'Endnote',
  footnote: 'Footnote',
}

interface Attrs {
  id: string
  contents: string
  kind: Kind
}

export interface FootnoteNode extends ManuscriptNode {
  attrs: Attrs
}

export const footnote: NodeSpec = {
  group: 'block',
  content: 'inline*',
  attrs: {
    id: { default: '' },
    contents: { default: '' },
    kind: { default: '' },
  },
  parseDOM: [
    {
      tag: 'div.footnote-contents',
      getAttrs: p => {
        const dom = p as HTMLDivElement

        const inner = dom.querySelector('p')

        return {
          id: dom.getAttribute('id'),
          contents: inner ? inner.innerHTML : '',
        }
      },
    },
  ],
  toDOM: node => {
    const footnoteNode = node as FootnoteNode

    return [
      'div',
      {
        class: 'footnote-contents',
      },
      [
        'div',
        {
          class: 'footnote-text',
        },
        [
          // TODO: multiple paragraphs?
          'p',
          {
            'placeholder-text': placeholderText[footnoteNode.attrs.kind],
          },
          0,
        ],
      ],
    ]
  },
}
