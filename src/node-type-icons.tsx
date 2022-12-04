/*!
 * © 2019 Atypon Systems LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import ListingIcon from '@manuscripts/assets/react/OutlineIconCodeSnippet'
import EquationIcon from '@manuscripts/assets/react/OutlineIconEquation'
import FigureIcon from '@manuscripts/assets/react/OutlineIconFigure'
import ManuscriptIcon from '@manuscripts/assets/react/OutlineIconManuscript'
import OrderedListIcon from '@manuscripts/assets/react/OutlineIconOrderedList'
import ParagraphIcon from '@manuscripts/assets/react/OutlineIconParagraph'
import SectionIcon from '@manuscripts/assets/react/OutlineIconSection'
import TableIcon from '@manuscripts/assets/react/OutlineIconTable'
import BulletListIcon from '@manuscripts/assets/react/OutlineIconUnorderedList'
import { ManuscriptNodeType, schema } from '@manuscripts/manuscript-transform'
import { BlockQuoteIcon, PullQuoteIcon } from '@manuscripts/style-guide'
import { schema as titleSchema } from '@manuscripts/title-editor'
import { NodeType } from 'prosemirror-model'
import React from 'react'

const { nodes } = schema

const icons: Map<
  ManuscriptNodeType,
  React.FunctionComponent<React.SVGAttributes<SVGElement>>
> = new Map([
  [nodes.bibliography_section, SectionIcon],
  [nodes.blockquote_element, BlockQuoteIcon],
  [nodes.bullet_list, BulletListIcon],
  [nodes.equation_element, EquationIcon],
  [nodes.figure_element, FigureIcon],
  [nodes.multi_graphic_figure_element, FigureIcon],
  [nodes.keywords_section, SectionIcon],
  [nodes.listing_element, ListingIcon],
  [nodes.ordered_list, OrderedListIcon],
  [nodes.paragraph, ParagraphIcon],
  [nodes.pullquote_element, PullQuoteIcon],
  [nodes.section, SectionIcon],
  [nodes.table_element, TableIcon],
  [nodes.toc_section, SectionIcon],
  [nodes.graphical_abstract_section, SectionIcon],
  [nodes.footnotes_section, SectionIcon],
])

export const nodeTypeIcon = (nodeType: NodeType) => {
  if (nodeType === titleSchema.nodes.title) {
    return <ManuscriptIcon />
  }

  const Icon = icons.get(nodeType as ManuscriptNodeType)

  return Icon ? <Icon /> : null
}
