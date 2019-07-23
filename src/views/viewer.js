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
import bibliographyElement from './bibliography_element';
import bulletList from './bullet_list';
import citation from './citation';
import crossReference from './cross_reference';
import equation from './equation';
import equationElement from './equation_element';
import figure from './figure';
import figureElement from './figure_element';
import inlineEquation from './inline_equation';
import inlineFootnote from './inline_footnote';
import link from './link';
import listing from './listing';
import listingElement from './listing_element';
import orderedList from './ordered_list';
import paragraph from './paragraph';
import placeholder from './placeholder';
import placeholderElement from './placeholder_element';
import sectionTitle from './section_title';
import tableElement from './table_element';
import tocElement from './toc_element';
import rmq_pos_start from './rmq_pos_start';
import rmq_pos_end from './rmq_pos_end';
export default (props) => ({
    bibliography_element: bibliographyElement(props),
    bullet_list: bulletList(props),
    citation: citation(props),
    cross_reference: crossReference(props),
    equation: equation(props),
    equation_element: equationElement(props),
    figure: figure(props),
    figure_element: figureElement(props),
    inline_equation: inlineEquation(props),
    inline_footnote: inlineFootnote(props),
    link: link(props),
    listing: listing(props),
    listing_element: listingElement(props),
    ordered_list: orderedList(props),
    paragraph: paragraph(props),
    placeholder: placeholder(props),
    placeholder_element: placeholderElement(props),
    section_title: sectionTitle(props),
    table_element: tableElement(props),
    toc_element: tocElement(props),
    rmq_pos_start: rmq_pos_start(props),
    rmq_pos_end: rmq_pos_end(props)
});
