import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
}

export interface TOCSectionNode extends ManuscriptNode {
  attrs: Attrs
}

export const tocSection: NodeSpec = {
  content: 'section_title toc_element',
  attrs: {
    id: { default: '' },
  },
  group: 'block sections',
  parseDOM: [
    {
      tag: 'section.toc',
    },
  ],
  toDOM: node => {
    const tocSectioNode = node as TOCSectionNode

    return [
      'section',
      {
        id: tocSectioNode.attrs.id,
        class: 'toc',
        spellcheck: 'false',
      },
      0,
    ]
  },
}
