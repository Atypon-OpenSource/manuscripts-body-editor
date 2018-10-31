import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  contents: string
}

export interface BibliographyElementNode extends ManuscriptNode {
  attrs: Attrs
}

const createBodyElement = (node: BibliographyElementNode) => {
  const dom = document.createElement('div')
  dom.className = 'csl-bib-body'
  dom.id = node.attrs.id

  return dom
}

const parseBodyElement = (node: BibliographyElementNode): Node => {
  // return document.createRange().createContextualFragment(node.attrs.contents)
  //   .firstChild as HTMLDivElement

  const dom = document.createElement('div')
  dom.innerHTML = node.attrs.contents // TODO: sanitize?
  return dom.firstChild || createBodyElement(node)
}

export const bibliographyElement: NodeSpec = {
  atom: true,
  attrs: {
    id: { default: '' },
    contents: { default: '' },
    placeholder: {
      default:
        'Citations inserted to the manuscript will be formatted here as a bibliography.',
    },
  },
  selectable: false,
  group: 'block',
  parseDOM: [
    {
      tag: 'div.csl-bib-body',
      getAttrs: p => {
        const dom = p as HTMLDivElement

        return {
          contents: dom.outerHTML,
        }
      },
    },
  ],
  toDOM: node => {
    const bibliographyElementNode = node as BibliographyElementNode

    return bibliographyElementNode.attrs.contents
      ? parseBodyElement(bibliographyElementNode)
      : createBodyElement(bibliographyElementNode)
  },
}
