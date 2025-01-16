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

import {
  OutlineBlockQuoteIcon,
  OutlineEquationIcon,
  OutlineEmbedIcon,
  OutlineFigureIcon,
  OutlineManuscriptIcon,
  OutlineOrderedListIcon,
  OutlineParagraphIcon,
  OutlinePullQuoteIcon,
  OutlineSectionIcon,
  OutlineTableIcon,
  OutlineUnorderedListIcon,
} from '@manuscripts/style-guide'
import { ManuscriptNodeType, schema } from '@manuscripts/transform'
import { NodeType } from 'prosemirror-model'
import React from 'react'

const { nodes } = schema

const icons: Map<
  ManuscriptNodeType,
  React.FunctionComponent<React.SVGAttributes<SVGElement>>
> = new Map([
  [nodes.manuscript, OutlineManuscriptIcon],
  [nodes.bibliography_section, OutlineSectionIcon],
  [nodes.blockquote_element, OutlineBlockQuoteIcon],
  [nodes.equation_element, OutlineEquationIcon],
  [nodes.embed, OutlineEmbedIcon],
  [nodes.figure_element, OutlineFigureIcon],
  [nodes.paragraph, OutlineParagraphIcon],
  [nodes.pullquote_element, OutlinePullQuoteIcon],
  [nodes.section, OutlineSectionIcon],
  [nodes.table_element, OutlineTableIcon],
  [nodes.graphical_abstract_section, OutlineSectionIcon],
  [nodes.footnotes_section, OutlineSectionIcon],
])

export const nodeTypeIcon = (nodeType: NodeType, listType?: string) => {
  if (nodeType === schema.nodes.list) {
    if (listType === 'bullet') {
      return <OutlineUnorderedListIcon />
    } else {
      return <OutlineOrderedListIcon />
    }
  }
  const Icon = icons.get(nodeType as ManuscriptNodeType)

  return Icon ? <Icon /> : null
}
