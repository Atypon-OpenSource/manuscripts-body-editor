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
import { ManuscriptNodeView, Nodes } from '@manuscripts/transform'

import { Dispatch } from '../commands'
import { NodeViewCreator } from '../types'
import affiliations from '../views/affiliations'
import alt_title from '../views/alt_title'
import alt_titles_section from '../views/alt_titles_section'
import authorNotes from '../views/author_notes'
import award from '../views/award'
import awards from '../views/awards'
import bibliographyElement from '../views/bibliography_element'
import blockquoteElement from '../views/blockquote_element_editable'
import boxElement from '../views/box_element'
import citation from '../views/citation_editable'
import contributors from '../views/contributors'
import crossReference from '../views/cross_reference_editable'
import embed from '../views/embed'
import empty from '../views/empty'
import equation from '../views/equation_editable'
import equationElement from '../views/equation_element_editable'
import figure from '../views/figure_editable'
import figureElement from '../views/figure_element_editable'
import footnote from '../views/footnote'
import footnotesElement from '../views/footnotes_element'
import generalTableFootnote from '../views/general_table_footnote'
import inlineEquation from '../views/inline_equation_editable'
import inlineFootnote from '../views/inline_footnote_editable'
import keyword from '../views/keyword'
import keywordGroup from '../views/keyword_group'
import link from '../views/link_editable'
import list from '../views/list'
import list_item from '../views/list_item'
import paragraph from '../views/paragraph_editable'
import placeholder from '../views/placeholder'
import placeholderElement from '../views/placeholder_element_editable'
import pullquoteElement from '../views/pullquote_element_editable'
import section from '../views/section'
import sectionLabel from '../views/section_label'
import sectionTitle from '../views/section_title_editable'
import tableCell from '../views/table_cell'
import tableElement from '../views/table_element_editable'
import tableElementFooter from '../views/table_element_footer'
import title from '../views/title_editable'
import { EditorProps } from './ManuscriptsEditor'

export default (
  props: EditorProps,
  dispatch: Dispatch
): Partial<Record<Nodes, NodeViewCreator<ManuscriptNodeView>>> => {
  return {
    title: title(props, dispatch),
    alt_title: alt_title(props),
    alt_titles: alt_titles_section(props),
    bibliography_element: bibliographyElement(props, dispatch),
    blockquote_element: blockquoteElement(props),
    box_element: boxElement(props),
    citation: citation(props, dispatch),
    cross_reference: crossReference(props, dispatch),
    contributors: contributors(props, dispatch),
    affiliations: affiliations(props, dispatch),
    embed: embed(props),
    equation: equation(props),
    equation_element: equationElement(props),
    figure: figure(props, dispatch),
    figure_element: figureElement(props, dispatch),
    image_element: figureElement(props, dispatch),
    footnote: footnote(props),
    footnotes_element: footnotesElement(props),
    general_table_footnote: generalTableFootnote(props, dispatch),
    inline_equation: inlineEquation(props),
    inline_footnote: inlineFootnote(props, dispatch),
    keyword: keyword(props, dispatch),
    keyword_group: keywordGroup(props, dispatch),
    link: link(props, dispatch),
    list: list(props),
    list_item: list_item(props),
    paragraph: paragraph(props),
    placeholder: placeholder(props),
    placeholder_element: placeholderElement(props),
    section: section(props),
    graphical_abstract_section: section(props),
    pullquote_element: pullquoteElement(props),
    section_title: sectionTitle(props),
    section_label: sectionLabel(props),
    table_element: tableElement(props),
    table_cell: tableCell(props),
    table_header: tableCell(props),
    table_element_footer: tableElementFooter(props),
    comments: empty('comments'),
    supplements: empty('supplements'),
    author_notes: authorNotes(props, dispatch),
    awards: awards(props, dispatch),
    award: award(props, dispatch),
  }
}
