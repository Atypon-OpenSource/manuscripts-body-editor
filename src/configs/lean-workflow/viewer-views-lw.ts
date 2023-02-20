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

import { FigureNode } from '@manuscripts/transform'
import { DefaultTheme } from 'styled-components'

import { Dispatch } from '../../commands'
import bibliographyElement from '../../views/bibliography_element'
import bibliographyItem from '../../views/bibliography_item'
import blockquoteElement from '../../views/blockquote_element'
import bulletList from '../../views/bullet_list'
import citation, { CitationViewProps } from '../../views/citation'
import crossReference, {
  CrossReferenceViewProps,
} from '../../views/cross_reference'
import equation from '../../views/equation'
import equationElement from '../../views/equation_element'
import figureElement from '../../views/figure_element'
import Figure, { FigureProps } from '../../views/FigureComponent'
import footnote from '../../views/footnote_editable'
import footnotesElement from '../../views/footnotes_element'
import inlineEquation from '../../views/inline_equation'
import inlineFootnote, {
  InlineFootnoteProps,
} from '../../views/inline_footnote'
import keywordsElement from '../../views/keywords_element'
import link from '../../views/link'
import metaSection from '../../views/meta_section'
import orderedList from '../../views/ordered_list'
import paragraph from '../../views/paragraph'
import placeholder from '../../views/placeholder'
import placeholderElement from '../../views/placeholder_element'
import pullquoteElement from '../../views/pullquote_element'
import ReactView from '../../views/ReactView'
import sectionLabel from '../../views/section_label'
import sectionTitle from '../../views/section_title'
import tableElement from '../../views/table_element'
import tocElement from '../../views/toc_element'

type ViewerProps = CitationViewProps &
  CrossReferenceViewProps &
  InlineFootnoteProps &
  FigureProps & { theme: DefaultTheme }

export default (props: ViewerProps, dispatch: Dispatch) => ({
  bibliography_item: bibliographyItem(props),
  bibliography_element: bibliographyElement(props),
  blockquote_element: blockquoteElement(props),
  bullet_list: bulletList(props),
  citation: citation(props),
  cross_reference: crossReference(props),
  equation: equation(props),
  equation_element: equationElement(props),
  figure: ReactView(dispatch, props.theme)<FigureNode>(Figure(props)),
  figure_element: figureElement(props),
  footnote: footnote(props),
  footnotes_element: footnotesElement(props),
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
  section_label: sectionLabel(props),
  table_element: tableElement(props),
  toc_element: tocElement(props),
  comment_list: metaSection(),
})
