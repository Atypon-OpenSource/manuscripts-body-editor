import { Schema } from 'prosemirror-model'
import {
  bold,
  code,
  italic,
  link,
  smallcaps,
  strikethrough,
  subscript,
  superscript,
  underline,
} from './marks'
import { bibliographyElement } from './nodes/bibliography_element'
import { bibliographySection } from './nodes/bibliography_section'
import { caption } from './nodes/caption'
import { citation } from './nodes/citation'
import { crossReference } from './nodes/cross_reference'
import { doc } from './nodes/doc'
import { equation } from './nodes/equation'
import { equationElement } from './nodes/equation_element'
import { figcaption } from './nodes/figcaption'
import { figureElement } from './nodes/figure_element'
import { footnote } from './nodes/footnote'
import { footnotesElement } from './nodes/footnotes_element'
import { hardBreak } from './nodes/hard_break'
import { inlineEquation } from './nodes/inline_equation'
import { inlineFootnote } from './nodes/inline_footnote'
import { bulletList, listItem, orderedList } from './nodes/list'
import { listing } from './nodes/listing'
import { listingElement } from './nodes/listing_element'
import { manuscript } from './nodes/manuscript'
import { paragraph } from './nodes/paragraph'
import { placeholder } from './nodes/placeholder'
import { placeholderElement } from './nodes/placeholder_element'
import { section } from './nodes/section'
import { sectionTitle } from './nodes/section_title'
import {
  table,
  tableBodyRow,
  tableCell,
  tableFooterRow,
  tableHeaderRow,
} from './nodes/table'
import { tableElement } from './nodes/table_element'
import { text } from './nodes/text'
import { tocElement } from './nodes/toc_element'
import { tocSection } from './nodes/toc_section'
import { uniprot } from './nodes/uniprot'
import { Marks, Nodes } from './types'

export const schema = new Schema<Nodes, Marks>({
  marks: {
    bold,
    code,
    italic,
    link,
    smallcaps,
    strikethrough,
    subscript,
    superscript,
    underline,
  },
  nodes: {
    bibliography_element: bibliographyElement,
    bibliography_section: bibliographySection,
    bullet_list: bulletList,
    caption,
    citation,
    cross_reference: crossReference,
    doc,
    equation,
    equation_element: equationElement,
    figcaption,
    figure_element: figureElement,
    footnote,
    footnotes_element: footnotesElement,
    hard_break: hardBreak,
    inline_equation: inlineEquation,
    inline_footnote: inlineFootnote,
    list_item: listItem,
    listing,
    listing_element: listingElement,
    manuscript,
    ordered_list: orderedList,
    paragraph,
    placeholder,
    placeholder_element: placeholderElement,
    section,
    section_title: sectionTitle,
    table,
    table_cell: tableCell,
    table_element: tableElement,
    tbody_row: tableBodyRow,
    text,
    tfoot_row: tableFooterRow,
    thead_row: tableHeaderRow,
    toc_element: tocElement,
    toc_section: tocSection,
    uniprot,
  },
})
