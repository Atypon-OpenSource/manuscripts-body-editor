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
import Bold from '@manuscripts/assets/react/ToolbarIconBold';
import Citation from '@manuscripts/assets/react/ToolbarIconCitation';
import CodeSnippet from '@manuscripts/assets/react/ToolbarIconCodeSnippet';
import Equation from '@manuscripts/assets/react/ToolbarIconEquation';
import Figure from '@manuscripts/assets/react/ToolbarIconFigure';
import InlineMath from '@manuscripts/assets/react/ToolbarIconInlineMath';
import Italic from '@manuscripts/assets/react/ToolbarIconItalic';
import OrderedList from '@manuscripts/assets/react/ToolbarIconOrderedList';
import Subscript from '@manuscripts/assets/react/ToolbarIconSubscript';
import Superscript from '@manuscripts/assets/react/ToolbarIconSuperscript';
import Symbol from '@manuscripts/assets/react/ToolbarIconSymbol';
import Table from '@manuscripts/assets/react/ToolbarIconTable';
import Underline from '@manuscripts/assets/react/ToolbarIconUnderline';
import UnorderedList from '@manuscripts/assets/react/ToolbarIconUnorderedList';
import React from 'react';
export default {
    italic: React.createElement(Italic, null),
    bold: React.createElement(Bold, null),
    subscript: React.createElement(Subscript, null),
    superscript: React.createElement(Superscript, null),
    underline: React.createElement(Underline, null),
    ordered_list: React.createElement(OrderedList, null),
    bullet_list: React.createElement(UnorderedList, null),
    figure_element: React.createElement(Figure, null),
    table_element: React.createElement(Table, null),
    citation: React.createElement(Citation, null),
    inline_equation: React.createElement(InlineMath, null),
    equation_element: React.createElement(Equation, null),
    listing_element: React.createElement(CodeSnippet, null),
    symbol: React.createElement(Symbol, null),
};
