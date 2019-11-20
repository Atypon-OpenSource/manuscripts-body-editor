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

import { dropCursor } from 'prosemirror-dropcursor'
// import { gapCursor } from 'prosemirror-gapcursor'
import 'prosemirror-gapcursor/style/gapcursor.css'
import { history } from 'prosemirror-history'
import { tableEditing } from 'prosemirror-tables'
import 'prosemirror-tables/style/tables.css'
import { EditorProps } from '../components/Editor'
import keys from '../keys'
import rules from '../rules'
import bibliography from './bibliography'
import elements from './elements'
import highlights from './highlight'
import models from './models'
import objects from './objects'
import paragraphs from './paragraphs'
import persist from './persist'
import placeholder from './placeholder'
import sections from './sections'
import styles from './styles'
import symbols from './symbols'

export default (props: EditorProps) => [
  rules,
  ...keys,
  dropCursor(),
  // gapCursor(),
  history(),
  models(props), // NOTE: this should come first
  ...props.plugins, // TODO: should these run after persist?
  elements(),
  persist(),
  sections(),
  styles(props),
  bibliography(props),
  objects(props),
  paragraphs(),
  placeholder(),
  tableEditing(),
  highlights(props),
  symbols(props),
]

// for tables
document.execCommand('enableObjectResizing', false, 'false')
document.execCommand('enableInlineTableEditing', false, 'false')
