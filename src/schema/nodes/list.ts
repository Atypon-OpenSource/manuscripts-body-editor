import { NodeSpec } from 'prosemirror-model'
import { buildElementClass } from '../../lib/attributes'
import { LIST_ELEMENT } from '../../transformer/object-types'
import { ManuscriptNode } from '../types'

export interface BulletListNode extends ManuscriptNode {
  attrs: {
    id: string
    paragraphStyle: string
  }
}

export const bulletList: NodeSpec = {
  content: 'list_item+',
  group: 'block list element',
  attrs: {
    id: { default: '' },
    paragraphStyle: { default: '' },
  },
  parseDOM: [{ tag: 'ul' }],
  toDOM: node => {
    const bulletListNode = node as BulletListNode

    return bulletListNode.attrs.id
      ? [
          'ul',
          {
            id: bulletListNode.attrs.id,
            // start: node.attrs.order === 1 ? undefined : node.attrs.order,
            class: buildElementClass(bulletListNode.attrs),
            'data-object-type': LIST_ELEMENT,
          },
          0,
        ]
      : ['ul', 0]
  },
}

export interface OrderedListNode extends ManuscriptNode {
  attrs: {
    id: string
    paragraphStyle: string
  }
}

export const orderedList: NodeSpec = {
  content: 'list_item+',
  group: 'block list element',
  attrs: {
    id: { default: '' },
    // order: { default: 1 },
    paragraphStyle: { default: '' },
  },
  parseDOM: [
    {
      tag: 'ol',
      getAttrs: p => {
        const dom = p as HTMLOListElement

        return {
          id: dom.getAttribute('id'),
          // order: dom.hasAttribute('start') ? dom.getAttribute('start') : 1,
        }
      },
    },
  ],
  toDOM: node => {
    const orderedListNode = node as OrderedListNode

    return orderedListNode.attrs.id
      ? [
          'ol',
          {
            id: orderedListNode.attrs.id,
            // start: node.attrs.order === 1 ? undefined : node.attrs.order,
            class: buildElementClass(orderedListNode.attrs),
            'data-object-type': LIST_ELEMENT,
          },
          0,
        ]
      : ['ol', 0]
  },
}

export interface ListItemNode extends ManuscriptNode {
  attrs: {
    placeholder: string
  }
}

export const listItem: NodeSpec = {
  // NOTE: can't mix inline (text) and block content (list)
  // content: 'paragraph list+',
  content: 'paragraph? (paragraph | list)+',
  group: 'block',
  defining: true,
  attrs: {
    placeholder: { default: 'List item' },
  },
  parseDOM: [
    {
      tag: 'li',
      getAttrs: p => {
        const dom = p as HTMLLIElement

        return {
          placeholder: dom.getAttribute('data-placeholder-text') || '',
        }
      },
    },
  ],
  toDOM: node => {
    const listItemNode = node as ListItemNode

    const attrs = listItemNode.attrs.placeholder
      ? {
          'data-placeholder-text': listItemNode.attrs.placeholder,
        }
      : undefined

    return ['li', attrs, 0]
  },
}

export type ListNode = BulletListNode | OrderedListNode

export const isListNode = (node: ManuscriptNode): node is ListNode => {
  const { nodes } = node.type.schema

  return node.type === nodes.bullet_list || node.type === nodes.ordered_list
}
