import { NodeSpec } from 'prosemirror-model'
import { INLINE_MATH_FRAGMENT } from '../../transformer/object-types'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  SVGRepresentation: string
  TeXRepresentation: string
}

export interface InlineEquationNode extends ManuscriptNode {
  attrs: Attrs
}

export const inlineEquation: NodeSpec = {
  // TODO: rid?
  attrs: {
    id: { default: '' },
    SVGRepresentation: { default: '' },
    TeXRepresentation: { default: '' },
  },
  atom: true,
  inline: true,
  draggable: true,
  group: 'inline',
  parseDOM: [
    {
      tag: `span.${INLINE_MATH_FRAGMENT}`,
      getAttrs: p => {
        const dom = p as HTMLSpanElement

        return {
          id: dom.getAttribute('id'),
          SVGRepresentation: dom.innerHTML || '',
          TeXRepresentation: dom.getAttribute('data-tex-representation') || '',
        }
      },
    },
    // TODO: convert MathML from pasted math elements?
  ],
  toDOM: node => {
    const inlineEquationNode = node as InlineEquationNode

    const dom = document.createElement('span')
    dom.classList.add(INLINE_MATH_FRAGMENT)
    dom.setAttribute('id', inlineEquationNode.attrs.id)
    dom.setAttribute(
      'data-tex-representation',
      inlineEquationNode.attrs.TeXRepresentation
    )
    dom.innerHTML = inlineEquationNode.attrs.SVGRepresentation

    return dom
  },
}
