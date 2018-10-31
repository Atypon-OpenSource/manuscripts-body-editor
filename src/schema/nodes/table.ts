// adapted from 'prosemirror-tables'

import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

// tslint:disable:cyclomatic-complexity
// ^ keeping this method as close to the original as possible, for ease of updating
const getCellAttrs = (p: Node | string) => {
  const dom = p as HTMLTableCellElement

  const widthAttr = dom.getAttribute('data-colwidth')
  const widths =
    widthAttr && /^\d+(,\d+)*$/.test(widthAttr)
      ? widthAttr.split(',').map(s => Number(s))
      : null
  const colspan = Number(dom.getAttribute('colspan') || 1)

  return {
    colspan,
    rowspan: Number(dom.getAttribute('rowspan') || 1),
    colwidth: widths && widths.length === colspan ? widths : null,
    background: dom.style.backgroundColor || null,
    placeholder: dom.getAttribute('data-placeholder-text') || '',
  }
}

interface TableNodeSpec extends NodeSpec {
  tableRole: string
}

export interface TableNode extends ManuscriptNode {
  attrs: {
    id: string
  }
}

export const table: TableNodeSpec = {
  content: 'thead_row tbody_row+ tfoot_row',
  tableRole: 'table',
  isolating: true,
  group: 'block',
  attrs: {
    id: { default: '' },
  },
  parseDOM: [
    {
      tag: 'table',
      getAttrs: p => {
        const dom = p as HTMLTableElement

        return {
          id: dom.getAttribute('id'),
        }
      },
    },
  ],
  toDOM: node => {
    const tableNode = node as TableNode

    return [
      'table',
      {
        id: tableNode.attrs.id,
      },
      ['tbody', 0],
    ]
  },
}

export interface TableHeaderRowNode extends ManuscriptNode {
  attrs: {
    id: string
  }
}

export const tableHeaderRow: TableNodeSpec = {
  content: 'table_cell+',
  tableRole: 'header',
  parseDOM: [
    {
      tag: 'tr.thead',
      priority: 100,
    },
    {
      tag: 'thead > tr',
      priority: 90,
    },
  ],
  toDOM: () => {
    return [
      'tr',
      {
        class: 'thead',
        // 'data-placeholder-text': node.attrs.placeholder || undefined,
      },
      0,
    ]
  },
}

export interface TableBodyRowNode extends ManuscriptNode {
  attrs: {
    placeholder: string
  }
}

export const tableBodyRow: TableNodeSpec = {
  content: 'table_cell+',
  tableRole: 'row',
  attrs: {
    placeholder: { default: '' },
  },
  parseDOM: [
    {
      tag: 'tr.tbody',
      priority: 100,
      // getAttrs: (dom: HTMLTableRowElement) => ({
      //   placeholder: dom.getAttribute('data-placeholder-text'),
      // }),
    },
    {
      tag: 'tbody > tr',
      priority: 90,
      // getAttrs: (dom: HTMLTableRowElement) => ({
      //   placeholder: dom.getAttribute('data-placeholder-text'),
      // }),
    },
    {
      tag: 'tr',
      priority: 80,
      // getAttrs: (dom: HTMLTableRowElement) => ({
      //   placeholder: dom.getAttribute('data-placeholder-text'),
      // }),
    },
  ],
  toDOM: node => {
    const tableBodyRowNode = node as TableBodyRowNode

    const attrs: { [key: string]: string } = {
      class: 'tbody',
    }

    if (tableBodyRowNode.attrs.placeholder) {
      attrs['data-placeholder-text'] = tableBodyRowNode.attrs.placeholder
    }

    return ['tr', attrs, 0]
  },
}

export interface TableFooterRowNode extends ManuscriptNode {
  attrs: {
    placeholder: string
  }
}

export const tableFooterRow: TableNodeSpec = {
  content: 'table_cell+',
  tableRole: 'footer',
  attrs: {
    placeholder: { default: '' },
  },
  parseDOM: [
    {
      tag: 'tr.tfoot',
      priority: 100,
    },
    {
      tag: 'tfoot > tr',
      priority: 90,
    },
  ],
  toDOM: node => {
    const tableFooterRowNode = node as TableFooterRowNode

    const attrs: { [key: string]: string } = {
      class: 'tfoot',
    }

    if (tableFooterRowNode.attrs.placeholder) {
      attrs['data-placeholder-text'] = tableFooterRowNode.attrs.placeholder
    }

    return ['tr', attrs, 0]
  },
}

export interface TableCellNode extends ManuscriptNode {
  attrs: {
    colspan: number | null
    rowspan: number | null
    colwidth: number[] | null
    background: string | null
    placeholder: string | null
  }
}

export const tableCell: TableNodeSpec = {
  content: 'inline*',
  attrs: {
    colspan: { default: 1 },
    rowspan: { default: 1 },
    colwidth: { default: null },
    background: { default: null },
    placeholder: { default: 'Data' }, // TODO: depends on cell type and position
  },
  tableRole: 'cell',
  isolating: true,
  parseDOM: [
    { tag: 'td', getAttrs: getCellAttrs },
    { tag: 'th', getAttrs: getCellAttrs },
  ],
  toDOM: node => {
    const tableCellNode = node as TableCellNode

    const attrs: { [attr: string]: string } = {}

    if (tableCellNode.attrs.colspan && tableCellNode.attrs.colspan !== 1) {
      attrs.colspan = String(tableCellNode.attrs.colspan)
    }

    if (tableCellNode.attrs.rowspan && tableCellNode.attrs.rowspan !== 1) {
      attrs.rowspan = String(tableCellNode.attrs.rowspan)
    }

    if (tableCellNode.attrs.background) {
      attrs.style = `backgroundColor: ${tableCellNode.attrs.background}`
    }

    if (tableCellNode.attrs.colwidth) {
      attrs['data-colwidth'] = tableCellNode.attrs.colwidth.join(',')
    }

    if (tableCellNode.attrs.placeholder) {
      attrs['data-placeholder-text'] = tableCellNode.attrs.placeholder
    }

    if (!tableCellNode.textContent) {
      attrs.class = 'placeholder'
    }

    return ['td', attrs, 0]
  },
}
