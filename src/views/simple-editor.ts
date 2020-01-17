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

import { EditorBaseProps } from '../components/EditorBase'
import bulletList from './bullet_list_editable'
import equation from './equation_editable'
import equationElement from './equation_element_editable'
import inlineEquation from './inline_equation_editable'
import orderedList from './ordered_list_editable'
import paragraph from './paragraph_editable'
import placeholder from './placeholder'
import placeholderElement from './placeholder_element_editable'
import sectionTitle from './section_title_editable'
import tableElement from './table_element_editable'
import tocElement from './toc_element_editable'

export default (props: EditorBaseProps) => ({
  bullet_list: bulletList(props),
  equation: equation(props),
  equation_element: equationElement(props),
  inline_equation: inlineEquation(props),
  ordered_list: orderedList(props),
  paragraph: paragraph(props),
  placeholder: placeholder(props),
  placeholder_element: placeholderElement(props),
  section_title: sectionTitle(props),
  table_element: tableElement(props),
  toc_element: tocElement(props),
})
