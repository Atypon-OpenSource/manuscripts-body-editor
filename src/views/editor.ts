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

import bibliographyElement from './bibliography_element_editable'
import blockquoteElement from './blockquote_element_editable'
import bulletList from './bullet_list_editable'
import citation, { CitationEditableProps } from './citation_editable'
import crossReference from './cross_reference_editable'
import { EditableBlockProps } from './editable_block'
import equation from './equation_editable'
import equationElement from './equation_element_editable'
import figure from './figure_editable'
import figureElement from './figure_element_editable'
import footnote from './footnote_editable'
import footnotesElement from './footnotes_element_editable'
import inlineEquation from './inline_equation_editable'
import inlineFootnote from './inline_footnote_editable'
import keywordsElement from './keywords_element_editable'
import link from './link_editable'
import listing, { ListingEditableProps } from './listing_editable'
import listingElement from './listing_element_editable'
import orderedList from './ordered_list_editable'
import paragraph from './paragraph_editable'
import placeholder from './placeholder'
import placeholderElement from './placeholder_element_editable'
import pullquoteElement from './pullquote_element_editable'
import sectionLabel from './section_label'
import sectionTitle from './section_title_editable'
import tableElement from './table_element_editable'
import tocElement from './toc_element_editable'

type EditorProps = EditableBlockProps &
  CitationEditableProps &
  ListingEditableProps

export default (props: EditorProps) => ({
  bibliography_element: bibliographyElement(props),
  blockquote_element: blockquoteElement(props),
  bullet_list: bulletList(props),
  citation: citation(props),
  cross_reference: crossReference(props),
  equation: equation(props),
  equation_element: equationElement(props),
  figure: figure(props),
  figure_element: figureElement(props),
  footnote: footnote(props),
  footnotes_element: footnotesElement(props),
  inline_equation: inlineEquation(props),
  inline_footnote: inlineFootnote(props),
  keywords_element: keywordsElement(props),
  link: link(props),
  listing: listing(props),
  listing_element: listingElement(props),
  ordered_list: orderedList(props),
  paragraph: paragraph(props),
  placeholder: placeholder(props),
  placeholder_element: placeholderElement(props),
  pullquote_element: pullquoteElement(props),
  section_title: sectionTitle(props),
  section_label: sectionLabel(props),
  table_element: tableElement(props),
  toc_element: tocElement(props),
})
