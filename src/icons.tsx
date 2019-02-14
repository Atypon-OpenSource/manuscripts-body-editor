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

import Bold from '@manuscripts/assets/react/ToolbarIconBold'
import Citation from '@manuscripts/assets/react/ToolbarIconCitation'
import CodeSnippet from '@manuscripts/assets/react/ToolbarIconCodeSnippet'
import Equation from '@manuscripts/assets/react/ToolbarIconEquation'
import Figure from '@manuscripts/assets/react/ToolbarIconFigure'
import InlineMath from '@manuscripts/assets/react/ToolbarIconInlineMath'
import Italic from '@manuscripts/assets/react/ToolbarIconItalic'
import OrderedList from '@manuscripts/assets/react/ToolbarIconOrderedList'
import Subscript from '@manuscripts/assets/react/ToolbarIconSubscript'
import Superscript from '@manuscripts/assets/react/ToolbarIconSuperscript'
import Symbol from '@manuscripts/assets/react/ToolbarIconSymbol'
import Table from '@manuscripts/assets/react/ToolbarIconTable'
import Underline from '@manuscripts/assets/react/ToolbarIconUnderline'
import UnorderedList from '@manuscripts/assets/react/ToolbarIconUnorderedList'
import React from 'react'

export default {
  italic: <Italic />,
  bold: <Bold />,
  subscript: <Subscript />,
  superscript: <Superscript />,
  underline: <Underline />,
  ordered_list: <OrderedList />,
  bullet_list: <UnorderedList />,
  figure_element: <Figure />,
  table_element: <Table />,
  citation: <Citation />,
  inline_equation: <InlineMath />,
  equation_element: <Equation />,
  listing_element: <CodeSnippet />,
  symbol: <Symbol />,
}
