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

import bibliographyElement from '../src/views/bibliography_element_editable'
import blockquoteElement from '../src/views/blockquote_element_editable'
import bulletList from '../src/views/bullet_list_editable'
import citation from '../src/views/citation_editable'
import crossReference from '../src/views/cross_reference_editable'
import { EditableBlockProps } from '../src/views/editable_block'
import equation from '../src/views/equation_editable'
import equationElement from '../src/views/equation_element_editable'
import figure from '../src/views/figure'
import figureElement from '../src/views/figure_element'
import inlineEquation from '../src/views/inline_equation_editable'
import inlineFootnote from '../src/views/inline_footnote_editable'
import keywordsElement from '../src/views/keywords_element_editable'
import link from '../src/views/link_editable'
import orderedList from '../src/views/ordered_list_editable'
import paragraph from '../src/views/paragraph_editable'
import placeholder from '../src/views/placeholder'
import placeholderElement from '../src/views/placeholder_element_editable'
import pullquoteElement from '../src/views/pullquote_element_editable'
import sectionTitle from '../src/views/section_title_editable'
import tableElement from '../src/views/table_element_editable'
import tocElement from '../src/views/toc_element_editable'

type ViewProps = EditableBlockProps

export default (props: ViewProps) => ({
  bibliography_element: bibliographyElement(props),
  blockquote_element: blockquoteElement(props),
  bullet_list: bulletList(props),
  citation: citation(props),
  cross_reference: crossReference(props),
  equation: equation(props),
  equation_element: equationElement(props),
  figure: figure(props),
  figure_element: figureElement(props),
  inline_equation: inlineEquation(props),
  inline_footnote: inlineFootnote(props),
  keywords_element: keywordsElement(props),
  link: link(props),
  ordered_list: orderedList(props),
  paragraph: paragraph(props),
  placeholder: placeholder(props),
  placeholder_element: placeholderElement(props),
  pullquote_element: pullquoteElement(props),
  section_title: sectionTitle(props),
  table_element: tableElement(props),
  toc_element: tocElement(props),
})
