import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  containedFigureID: string
  containedObjectID: string
  suppressCaption: boolean
  isExpanded: boolean
}

export interface ListingElementNode extends ManuscriptNode {
  attrs: Attrs
}

export const listingElement: NodeSpec = {
  content: '(listing | placeholder) figcaption',
  attrs: {
    id: { default: '' },
    containedFigureID: { default: '' },
    containedObjectID: { default: '' },
    suppressCaption: { default: true },
    isExpanded: { default: false },
  },
  group: 'block element',
  parseDOM: [
    {
      tag: 'figure.listing',
      getAttrs: p => {
        const dom = p as HTMLElement

        return {
          id: dom.getAttribute('id'),
        }
      },
    },
  ],
  toDOM: node => {
    const listingElementNode = node as ListingElementNode

    return [
      'figure',
      {
        class: 'listing', // TODO: suppress-caption?
        id: listingElementNode.attrs.id,
      },
      0,
    ]
  },
}
