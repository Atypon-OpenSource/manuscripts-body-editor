import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  rid: string
  contents: string
}

export interface InlineFootnoteNode extends ManuscriptNode {
  attrs: Attrs
}

export const inlineFootnote: NodeSpec = {
  attrs: {
    rid: { default: '' },
    contents: { default: '' },
  },
  atom: true,
  inline: true,
  draggable: true,
  group: 'inline',
  parseDOM: [
    {
      tag: 'span.footnote',
      getAttrs: p => {
        const dom = p as HTMLSpanElement

        return {
          rid: dom.getAttribute('id'),
          contents: dom.textContent,
        }
      },
    },
  ],
  toDOM: node => {
    const inlineFootnodeNode = node as InlineFootnoteNode

    const dom = document.createElement('span')
    dom.className = 'footnote'
    dom.setAttribute('id', inlineFootnodeNode.attrs.rid)
    dom.textContent = inlineFootnodeNode.attrs.contents

    return dom
  },
}
