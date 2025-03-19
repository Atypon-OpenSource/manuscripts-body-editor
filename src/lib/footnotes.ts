/*!
 * © 2024 Atypon Systems LLC
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

import {
  FootnoteNode,
  generateNodeID,
  ManuscriptEditorState,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import {
  findParentNodeOfType,
  findParentNodeOfTypeClosestToPos,
} from 'prosemirror-utils'

import { footnotesKey } from '../plugins/footnotes'

export const findFootnotesContainerNode = (
  doc: ManuscriptNode,
  pos: number
) => {
  const $pos = doc.resolve(pos)
  return (
    findParentNodeOfTypeClosestToPos($pos, schema.nodes.table_element) || {
      node: doc,
      pos: 0,
    }
  )
}

export const findParentFootnote = findParentNodeOfType([
  schema.nodes.footnote,
  schema.nodes.general_table_footnote,
])

export const getFootnotesElementState = (
  state: ManuscriptEditorState,
  id: string
) => {
  const fns = footnotesKey.getState(state)
  if (!fns) {
    return
  }
  const elementID = fns.footnotesElementIDs.get(id)
  if (!elementID) {
    return
  }
  return fns.footnotesElements.get(elementID)
}

export const getFootnoteLabel = (
  state: ManuscriptEditorState,
  footnote: FootnoteNode
) => {
  const id = footnote.attrs.id
  const fns = getFootnotesElementState(state, id)
  return fns?.labels.get(id) || ''
}

export const createFootnote = () => {
  return schema.nodes.footnote.createAndFill(
    {
      id: generateNodeID(schema.nodes.footnote),
      kind: 'footnote',
    },
    [schema.nodes.paragraph.create({})]
  ) as FootnoteNode
}
