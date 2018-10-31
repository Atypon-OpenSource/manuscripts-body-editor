import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

export interface ActualManuscriptNode extends ManuscriptNode {
  attrs: {
    id: string
  }
}

export const manuscript: NodeSpec = {
  content: '(section | bibliography_section | toc_section)+',
  attrs: {
    id: { default: '' },
  },
  group: 'block',
  parseDOM: [
    {
      tag: 'article',
      getAttrs: p => {
        const dom = p as HTMLElement

        return {
          id: dom.getAttribute('id'),
        }
      },
    },
  ],
  toDOM: node => {
    const manuscriptNode = node as ActualManuscriptNode

    return [
      'article',
      {
        id: manuscriptNode.attrs.id,
      },
      0,
    ]
  },
}
