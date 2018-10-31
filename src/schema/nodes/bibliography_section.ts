import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
}

export interface BibliographySectionNode extends ManuscriptNode {
  attrs: Attrs
}

export const bibliographySection: NodeSpec = {
  content: 'section_title bibliography_element',
  attrs: {
    id: { default: '' },
  },
  group: 'block sections',
  parseDOM: [
    {
      tag: 'section.bibliography',
    },
  ],
  toDOM: node => {
    const bibliographySectionNode = node as BibliographySectionNode

    return [
      'section',
      {
        id: bibliographySectionNode.attrs.id,
        class: 'bibliography',
        spellcheck: 'false',
      },
      0,
    ]
  },
}
