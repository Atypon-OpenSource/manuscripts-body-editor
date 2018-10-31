import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  contents: string
}

export interface TOCElementNode extends ManuscriptNode {
  attrs: Attrs
}

const createBodyElement = (node: ManuscriptNode) => {
  const dom = document.createElement('div')
  dom.className = 'manuscript-toc'
  dom.id = node.attrs.id

  return dom
}

const parseBodyElement = (node: ManuscriptNode): Node => {
  // return document.createRange().createContextualFragment(node.attrs.contents)
  //   .firstChild as HTMLDivElement

  const dom = document.createElement('div')
  dom.innerHTML = node.attrs.contents // TODO: sanitize?
  return dom.firstChild || createBodyElement(node)
}

export const tocElement: NodeSpec = {
  atom: true,
  attrs: {
    id: { default: '' },
    contents: { default: '' },
  },
  group: 'block',
  parseDOM: [
    {
      tag: 'div.manuscript-toc',
      getAttrs: p => {
        const dom = p as HTMLDivElement

        return {
          contents: dom.innerHTML,
        }
      },
    },
  ],
  toDOM: node => {
    const tocElementNode = node as TOCElementNode

    return tocElementNode.attrs.contents
      ? parseBodyElement(tocElementNode)
      : createBodyElement(tocElementNode)
  },
}
