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
  ManuscriptEditorState,
  ManuscriptNode, schema
} from '@manuscripts/transform'

import { footnotesKey } from '../plugins/footnotes'
import {
  findParentNodeOfType,
  findParentNodeOfTypeClosestToPos
} from "prosemirror-utils";

export const generateAlphaLabel = (index: number) => {
  const unicodeInterval = [97, 123]
  const places = unicodeInterval[1] - unicodeInterval[0]

  function getClassCount(n: number, order: number) {
    return n * Math.pow(places, order - 1)
  }

  let indices: number[] | null = null

  for (;;) {
    let current = index
    let position = 1
    while (current >= places) {
      current = current / places
      position++
    }
    const newIndex = Math.floor(current)
    indices = indices ? indices : new Array(position).fill(0)
    indices.splice(indices.length - position, 1, newIndex)

    index -= getClassCount(newIndex, position)

    if (position === 1) {
      break
    }
  }
  return (indices || [])
    .map((v, i, array) => {
      // offseting to start with zero for the second and later classes
      // @TODO: find better solution instead of this indexing offset
      if (array.length > 1 && i !== array.length - 1) {
        return String.fromCodePoint(v + unicodeInterval[0] - 1)
      }
      return String.fromCodePoint(v + unicodeInterval[0])
    })
    .join('')
}

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
