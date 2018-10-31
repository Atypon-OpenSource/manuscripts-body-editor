import { NodeSpec } from 'prosemirror-model'
import { LISTING } from '../../transformer/object-types'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  contents: string
  language: string
  languageKey: string
}

export interface ListingNode extends ManuscriptNode {
  attrs: Attrs
}

export const listing: NodeSpec = {
  attrs: {
    id: { default: '' },
    contents: { default: '' },
    language: { default: '' },
    languageKey: { default: '' },
    // placeholder: { default: 'Click to edit listing' },
  },
  group: 'block',
  parseDOM: [
    {
      tag: `pre.${LISTING}`,
      preserveWhitespace: 'full',
      getAttrs: p => {
        const node = p as HTMLPreElement

        return {
          contents: node.textContent, // TODO: innerText?
          language: node.getAttribute('language'),
          languageKey: node.getAttribute('languageKey'),
        }
      },
      priority: 100,
    },
    {
      tag: 'pre',
      preserveWhitespace: 'full',
      getAttrs: p => {
        const node = p as HTMLPreElement

        return {
          contents: node.getAttribute('code') || node.textContent,
          languageKey: node.getAttribute('language'),
        }
      },
      priority: 90,
    },
  ],
  toDOM: node => {
    const listingNode = node as ListingNode

    const dom = document.createElement('div')
    dom.setAttribute('id', listingNode.attrs.id)
    dom.classList.add(LISTING)
    dom.setAttribute('data-language', listingNode.attrs.language)
    dom.setAttribute('data-languageKey', listingNode.attrs.languageKey)
    dom.textContent = listingNode.attrs.contents

    return dom
  },
}
