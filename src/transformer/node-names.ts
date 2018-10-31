import { schema } from '../schema'
import { ManuscriptNodeType } from '../schema/types'

export const nodeNames: Map<ManuscriptNodeType, string> = new Map([
  [schema.nodes.bibliography_element, 'Bibliography'],
  [schema.nodes.bibliography_section, 'Section'],
  [schema.nodes.citation, 'Citation'],
  [schema.nodes.listing_element, 'Listing'],
  [schema.nodes.cross_reference, 'Cross Reference'],
  [schema.nodes.equation_element, 'Equation'],
  [schema.nodes.figure_element, 'Figure'],
  // [schema.nodes.figure, 'Figure'],
  [schema.nodes.bullet_list, 'Bullet List'],
  [schema.nodes.ordered_list, 'Ordered List'],
  [schema.nodes.manuscript, 'Manuscript'],
  [schema.nodes.paragraph, 'Paragraph'],
  [schema.nodes.section, 'Section'],
  [schema.nodes.section_title, 'Section'],
  [schema.nodes.table, 'Table'],
  [schema.nodes.table_element, 'Table'],
])
