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

import { FigureNode } from '@manuscripts/manuscript-transform'
import { DefaultTheme } from 'styled-components'

import { Dispatch } from '../../commands'
import bibliographyElement from '../../views/bibliography_element_editable'
import blockquoteElement from '../../views/blockquote_element_editable'
import bulletList from '../../views/bullet_list_editable'
import citation, { CitationEditableProps } from '../../views/citation_editable'
import crossReference from '../../views/cross_reference_editable'
import { EditableBlockProps } from '../../views/editable_block'
import equation from '../../views/equation_editable'
import equationElement from '../../views/equation_element_editable'
import Figure, { FigureProps } from '../../views/FigureComponent'
import FigureElement from '../../views/FigureElement'
import footnote from '../../views/footnote_editable'
import footnotesElement from '../../views/footnotes_element'
import inlineEquation from '../../views/inline_equation_editable'
import inlineFootnote from '../../views/inline_footnote_editable'
import keywordsElement from '../../views/keywords_element_editable'
import link from '../../views/link_editable'
import listing from '../../views/listing_editable'
import listingElement from '../../views/listing_element_editable'
import orderedList from '../../views/ordered_list_editable'
import paragraph from '../../views/paragraph_editable'
import placeholder from '../../views/placeholder'
import placeholderElement from '../../views/placeholder_element_editable'
import pullquoteElement from '../../views/pullquote_element_editable'
import ReactView from '../../views/ReactView'
import sectionTitle from '../../views/section_title_editable'
import TableElement from '../../views/TableElement'
import tocElement from '../../views/toc_element_editable'

type EditorProps = EditableBlockProps &
  CitationEditableProps &
  FigureProps & { theme: DefaultTheme }

export default (props: EditorProps, dispatch: Dispatch) => {
  return {
    bibliography_element: bibliographyElement(props),
    blockquote_element: blockquoteElement(props),
    bullet_list: bulletList(props),
    citation: citation(props),
    cross_reference: crossReference(props),
    equation: equation(props),
    equation_element: equationElement(props),
    figure: ReactView(dispatch, props.theme)<FigureNode>(Figure(props)),
    figure_element: ReactView(dispatch, props.theme)(
      FigureElement(props),
      'div',
      {
        stopEvent: () => true,
        ignoreMutation: () => true,
      }
    ),
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
    table_element: ReactView(dispatch, props.theme)(
      TableElement(props),
      'figure',
      {
        stopEvent: () => false,
        ignoreMutation: () => true,
      }
    ),
    toc_element: tocElement(props),
  }
}
