import { schema } from '../schema'
import { ManuscriptNode, ManuscriptNodeType } from '../schema/types'

export const nodeTypesMap: Map<ManuscriptNodeType, string> = new Map([
  [schema.nodes.bibliography_element, 'MPBibliographyElement'],
  [schema.nodes.bibliography_section, 'MPSection'],
  [schema.nodes.bullet_list, 'MPListElement'],
  [schema.nodes.citation, 'MPCitation'],
  [schema.nodes.cross_reference, 'MPAuxiliaryObjectReference'],
  [schema.nodes.equation, 'MPEquation'],
  [schema.nodes.equation_element, 'MPEquationElement'],
  // [schema.nodes.figure, 'MPFigure'],
  [schema.nodes.figure_element, 'MPFigureElement'],
  [schema.nodes.footnote, 'MPFootnote'],
  [schema.nodes.footnotes_element, 'MPFootnotesElement'],
  [schema.nodes.inline_equation, 'MPInlineMathFragment'],
  [schema.nodes.listing, 'MPListing'],
  [schema.nodes.listing_element, 'MPListingElement'],
  [schema.nodes.ordered_list, 'MPListElement'],
  [schema.nodes.paragraph, 'MPParagraphElement'],
  [schema.nodes.section, 'MPSection'],
  [schema.nodes.table, 'MPTable'],
  [schema.nodes.table_element, 'MPTableElement'],
  [schema.nodes.toc_element, 'MPTOCElement'],
  [schema.nodes.toc_section, 'MPSection'],
])

const elementNodeTypes: ManuscriptNodeType[] = [
  schema.nodes.listing_element,
  schema.nodes.equation_element,
  schema.nodes.figure_element,
  schema.nodes.bullet_list,
  schema.nodes.ordered_list,
  schema.nodes.paragraph,
  schema.nodes.table_element,
]

export const isElementNode = (node: ManuscriptNode) =>
  elementNodeTypes.includes(node.type)
