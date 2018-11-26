import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  accession: string
}

export interface UniprotNode extends ManuscriptNode {
  attrs: Attrs
}

export const uniprot: NodeSpec = {
  attrs: {
    accession: { default: '' },
  },
  atom: true,
  inline: true,
  group: 'inline',
  parseDOM: [
    {
      tag: `a.uniprot`,
      getAttrs: p => {
        const dom = p as HTMLAnchorElement

        return {
          accession: dom.textContent,
        }
      },
    },
  ],
  toDOM: node => {
    return [
      'a',
      {
        class: 'uniprot',
        href: 'https://www.uniprot.org/uniprot/' + node.attrs.accession,
        target: 'uniprot',
      },
      node.attrs.accession,
    ]
  },
}
