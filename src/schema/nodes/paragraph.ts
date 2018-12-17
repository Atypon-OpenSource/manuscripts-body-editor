import { NodeSpec } from 'prosemirror-model'
import { buildElementClass } from '../../lib/attributes'
import { PARAGRAPH } from '../../transformer/object-types'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  paragraphStyle: string
  placeholder: string
}

export interface ParagraphNode extends ManuscriptNode {
  attrs: Attrs
}

export const paragraph: NodeSpec = {
  content: 'inline*',
  attrs: {
    id: { default: '' },
    paragraphStyle: { default: '' }, // TODO: default paragraph style
    placeholder: { default: '' }, // TODO: 'List item' if inside a list
    // tight: { default: false }, // https://gitlab.com/mpapp-private/manuscripts-frontend/issues/75
  },
  group: 'block element',
  parseDOM: [
    {
      tag: 'p',
      getAttrs: p => {
        const dom = p as HTMLParagraphElement

        const attrs: Partial<Attrs> = {
          id: dom.getAttribute('id') || undefined,
        }

        const placeholder = dom.getAttribute('data-placeholder-text')

        if (placeholder) {
          attrs.placeholder = placeholder
        }

        // https://gitlab.com/mpapp-private/manuscripts-frontend/issues/75
        // attrs.tight = dom.parentNode && dom.parentNode.nodeName === 'LI',

        return attrs
      },
    },
  ],
  toDOM: node => {
    const paragraphNode = node as ParagraphNode

    const attrs: { [key: string]: string } = {}

    if (paragraphNode.attrs.id) {
      attrs.id = paragraphNode.attrs.id
    }

    attrs.class = buildElementClass(paragraphNode.attrs)

    attrs['data-object-type'] = PARAGRAPH

    if (paragraphNode.attrs.placeholder) {
      attrs['data-placeholder-text'] = paragraphNode.attrs.placeholder
    }

    return ['p', attrs, 0]
  },
}

export const isParagraphNode = (node: ManuscriptNode): node is ParagraphNode =>
  node.type === node.type.schema.nodes.paragraph
