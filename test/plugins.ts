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

// import { gapCursor } from 'prosemirror-gapcursor'
import 'prosemirror-gapcursor/style/gapcursor.css'
import 'prosemirror-tables/style/tables.css'

import { dropCursor } from 'prosemirror-dropcursor'
import { history } from 'prosemirror-history'
import { tableEditing } from 'prosemirror-tables'

import keys from '../src/keys'
import bibliography from '../src/plugins/bibliography'
import { BibliographyProps } from '../src/plugins/bibliography/types'
import elements from '../src/plugins/elements'
import paragraphs from '../src/plugins/paragraphs'
import placeholder from '../src/plugins/placeholder'
import sections from '../src/plugins/sections'
import rules from '../src/rules'

export default (props: BibliographyProps) => {
  const { getModel, getLibraryItem, getCitationProvider } = props

  return [
    rules,
    ...keys,
    dropCursor(),
    // gapCursor(),
    // bibliography({ getModel, getLibraryItem, getCitationProvider }),
    history(),
    elements(),
    sections(),
    paragraphs(),
    placeholder(),
    tableEditing(),
  ]
}
