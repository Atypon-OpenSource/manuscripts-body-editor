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

import { DefaultTheme } from 'styled-components'

import { Dispatch } from '../commands'
import affiliations from '../views/affiliations'
import bibliographyElement from '../views/bibliography_element_editable'
import blockquoteElement from '../views/blockquote_element_editable'
import citation from '../views/citation_editable'
import contributors from '../views/contributors'
import crossReference from '../views/cross_reference_editable'
import { EditableBlockProps } from '../views/editable_block'
import empty from '../views/empty'
import equation from '../views/equation_editable'
import equationElement from '../views/equation_element_editable'
import figure, { FigureProps } from '../views/figure_editable'
import figureElement from '../views/figure_element_editable'
import footnote from '../views/footnote_editable'
import footnotesElement from '../views/footnotes_element'
import inlineEquation from '../views/inline_equation_editable'
import inlineFootnote from '../views/inline_footnote_editable'
import keyword from '../views/keyword'
import keywordGroup from '../views/keyword_group'
import link from '../views/link_editable'
import list from '../views/list'
import listing from '../views/listing_editable'
import listingElement from '../views/listing_element_editable'
import paragraph from '../views/paragraph_editable'
import placeholder from '../views/placeholder'
import placeholderElement from '../views/placeholder_element_editable'
import pullquoteElement from '../views/pullquote_element_editable'
import sectionLabel from '../views/section_label'
import sectionTitle from '../views/section_title_editable'
import tableElement from '../views/table_element_editable'
import tableElementFooter from '../views/table_element_footer_editable'
import title from '../views/title_editable'
import tocElement from '../views/toc_element_editable'

type EditorProps = EditableBlockProps & FigureProps & { theme: DefaultTheme }

export default (props: EditorProps, dispatch: Dispatch) => {
  return {
    title: title(props, dispatch),
    bibliography_element: bibliographyElement(props, dispatch),
    blockquote_element: blockquoteElement(props),
    list: list(props),
    citation: citation(props, dispatch),
    cross_reference: crossReference(props, dispatch),
    contributors: contributors(props, dispatch),
    affiliations: affiliations(props, dispatch),
    equation: equation(props),
    equation_element: equationElement(props),
    figure: figure(props, dispatch),
    figure_element: figureElement(props, dispatch),
    footnote: footnote(props),
    footnotes_element: footnotesElement(props),
    inline_equation: inlineEquation(props),
    inline_footnote: inlineFootnote(props, dispatch),
    keyword: keyword(props, dispatch),
    keyword_group: keywordGroup(props, dispatch),
    link: link(props, dispatch),
    listing: listing(props),
    listing_element: listingElement(props),
    paragraph: paragraph(props),
    placeholder: placeholder(props),
    placeholder_element: placeholderElement(props),
    pullquote_element: pullquoteElement(props),
    section_title: sectionTitle(props),
    section_label: sectionLabel(props),
    table_element: tableElement(props),
    table_element_footer: tableElementFooter(props),
    toc_element: tocElement(props),
    comments: empty('comments'),
    supplements: empty('supplements'),
  }
}
