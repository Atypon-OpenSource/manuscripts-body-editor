import ListingIcon from '@manuscripts/assets/react/OutlineIconCodeSnippet'
import EquationIcon from '@manuscripts/assets/react/OutlineIconEquation'
import FigureIcon from '@manuscripts/assets/react/OutlineIconFigure'
import ManuscriptIcon from '@manuscripts/assets/react/OutlineIconManuscript'
import OrderedListIcon from '@manuscripts/assets/react/OutlineIconOrderedList'
import ParagraphIcon from '@manuscripts/assets/react/OutlineIconParagraph'
import SectionIcon from '@manuscripts/assets/react/OutlineIconSection'
import TableIcon from '@manuscripts/assets/react/OutlineIconTable'
import BulletListIcon from '@manuscripts/assets/react/OutlineIconUnorderedList'
import { schema as titleSchema } from '@manuscripts/title-editor'
import React from 'react'
import { schema } from '../schema'
import { ManuscriptNodeType } from '../schema/types'

const { nodes } = schema

const icons: Map<
  ManuscriptNodeType,
  React.SFC<React.SVGAttributes<SVGElement>>
> = new Map([
  [nodes.bibliography_element, SectionIcon],
  [nodes.bullet_list, BulletListIcon],
  [nodes.equation_element, EquationIcon],
  [nodes.figure_element, FigureIcon],
  [nodes.listing_element, ListingIcon],
  [nodes.ordered_list, OrderedListIcon],
  [nodes.paragraph, ParagraphIcon],
  [nodes.section, SectionIcon],
  [nodes.table_element, TableIcon],
])

export const nodeTypeIcon = (nodeType: ManuscriptNodeType) => {
  if (nodeType === titleSchema.nodes.title) {
    return <ManuscriptIcon />
  }

  const Icon = icons.get(nodeType)

  return Icon ? <Icon /> : null
}
