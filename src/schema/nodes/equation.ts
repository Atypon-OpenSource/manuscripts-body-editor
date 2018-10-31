import { NodeSpec } from 'prosemirror-model'
import { EQUATION } from '../../transformer/object-types'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  SVGStringRepresentation: string
  TeXRepresentation: string
}

export interface EquationNode extends ManuscriptNode {
  attrs: Attrs
}

export const equation: NodeSpec = {
  attrs: {
    id: { default: '' },
    SVGStringRepresentation: { default: '' },
    TeXRepresentation: { default: '' },
    // placeholder: { default: 'Click to edit equation' },
  },
  group: 'block',
  parseDOM: [
    {
      tag: `div.${EQUATION}`,
      getAttrs: p => {
        const dom = p as HTMLDivElement

        return {
          SVGStringRepresentation: dom.innerHTML,
          TeXRepresentation: dom.getAttribute('data-tex-representation'),
        }
      },
    },
    // TODO: convert MathML from pasted math elements?
  ],
  toDOM: node => {
    const equationNode = node as EquationNode

    const dom = document.createElement('div')
    dom.setAttribute('id', equationNode.attrs.id)
    dom.classList.add(EQUATION)
    dom.setAttribute(
      'data-tex-representation',
      equationNode.attrs.TeXRepresentation
    )
    dom.innerHTML = equationNode.attrs.SVGStringRepresentation

    return dom
  },
}
