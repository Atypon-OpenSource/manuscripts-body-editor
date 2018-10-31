import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  contents: string
}

export interface FootnotesElementNode extends ManuscriptNode {
  attrs: Attrs
}

const createBodyElement = (node: FootnotesElementNode) => {
  const dom = document.createElement('div')
  dom.className = 'csl-bib-body'
  dom.id = node.attrs.id

  return dom
}

const parseBodyElement = (node: FootnotesElementNode): HTMLDivElement => {
  // return document.createRange().createContextualFragment(node.attrs.contents)
  //   .firstChild as HTMLDivElement

  const dom = document.createElement('div')
  dom.innerHTML = node.attrs.contents // TODO: sanitize?
  return (dom.firstChild as HTMLDivElement) || createBodyElement(node)
}

export const footnotesElement: NodeSpec = {
  atom: true,
  attrs: {
    id: { default: '' },
    // collateByKind: { default: 'footnote' },
    contents: { default: '' },
  },
  group: 'block element',
  parseDOM: [
    {
      tag: 'div.footnotes',
      getAttrs: p => {
        const dom = p as HTMLDivElement

        return {
          // collateByKind: dom.getAttribute('collateByKind'),
          contents: dom.innerHTML,
        }
      },
    },
  ],
  toDOM: node => {
    const footnotesElementNode = node as FootnotesElementNode

    return footnotesElementNode.attrs.contents
      ? parseBodyElement(footnotesElementNode)
      : createBodyElement(footnotesElementNode)
  },
}
