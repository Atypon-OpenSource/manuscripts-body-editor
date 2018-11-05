import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  rid: string
  contents: string
}

export interface CitationNode extends ManuscriptNode {
  attrs: Attrs
}

export const citation: NodeSpec = {
  inline: true,
  group: 'inline',
  draggable: true,
  atom: true,
  attrs: {
    rid: { default: '' },
    contents: { default: '' },
    selectedText: { default: '' },
  },
  parseDOM: [
    {
      tag: 'span.citation',
      getAttrs: p => {
        const dom = p as HTMLSpanElement

        return {
          rid: dom.getAttribute('data-reference-id'),
          contents: dom.innerHTML,
        }
      },
    },
  ],
  toDOM: node => {
    const citationNode = node as CitationNode

    const dom = document.createElement('span')
    dom.className = 'citation'
    dom.setAttribute('data-reference-id', citationNode.attrs.rid)
    dom.innerHTML = citationNode.attrs.contents

    return dom
  },
}

export const isCitationNode = (node: ManuscriptNode): node is CitationNode =>
  node.type === node.type.schema.nodes.citation
