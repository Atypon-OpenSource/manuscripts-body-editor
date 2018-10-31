import listing from '@manuscripts/assets/react/OutlineIconCodeSnippet'
import equationElement from '@manuscripts/assets/react/OutlineIconEquation'
import figure from '@manuscripts/assets/react/OutlineIconFigure'
import manuscript from '@manuscripts/assets/react/OutlineIconManuscript'
import orderedList from '@manuscripts/assets/react/OutlineIconOrderedList'
import paragraph from '@manuscripts/assets/react/OutlineIconParagraph'
import section from '@manuscripts/assets/react/OutlineIconSection'
import table from '@manuscripts/assets/react/OutlineIconTable'
import unorderedList from '@manuscripts/assets/react/OutlineIconUnorderedList'
import React from 'react'
import { schema } from '../schema'
import { ManuscriptNodeType } from '../schema/types'

const icons: Map<
  ManuscriptNodeType,
  React.SFC<React.SVGAttributes<SVGElement>>
> = new Map([
  [schema.nodes.bibliography_element, section],
  [schema.nodes.bullet_list, unorderedList],
  [schema.nodes.listing_element, listing],
  [schema.nodes.equation_element, equationElement],
  [schema.nodes.title, manuscript],
  [schema.nodes.figure_element, figure],
  [schema.nodes.ordered_list, orderedList],
  [schema.nodes.paragraph, paragraph],
  [schema.nodes.section, section],
  [schema.nodes.table_element, table],
])

export const nodeTypeIcon = (nodeType: ManuscriptNodeType) => {
  const Icon = icons.get(nodeType)

  return Icon ? <Icon /> : null
}
