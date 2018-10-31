import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  paragraphStyle: string
  tableStyle: string
  label: string
  suppressCaption: boolean
  suppressFooter: boolean
  suppressHeader: boolean
}

export interface TableElementNode extends ManuscriptNode {
  attrs: Attrs
}

export const tableElement: NodeSpec = {
  content: '(table | placeholder) figcaption',
  attrs: {
    id: { default: '' },
    paragraphStyle: { default: '' },
    tableStyle: { default: '' },
    label: { default: '' },
    suppressCaption: { default: false },
    suppressFooter: { default: false },
    suppressHeader: { default: false },
  },
  selectable: false,
  group: 'block element',
  parseDOM: [
    {
      tag: 'figure.table',
      getAttrs: dom => {
        const element = dom as HTMLTableElement

        return {
          id: element.getAttribute('id'),
          paragraphStyle: element.getAttribute('data-paragraph-style') || '',
          tableStyle: element.getAttribute('data-table-style') || '',
          // table: table ? table.id : null,
        }
      },
    },
  ],
  toDOM: node => {
    const tableElementNode = node as TableElementNode

    return [
      'figure',
      {
        class: 'table', // TODO: suppress-header, suppress-footer?
        id: tableElementNode.attrs.id,
        'data-paragraph-style': tableElementNode.attrs.paragraphStyle,
        'data-table-style': tableElementNode.attrs.tableStyle,
      },
      0,
    ]
  },
}
