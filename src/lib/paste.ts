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

import { ManuscriptSlice } from '@manuscripts/manuscript-transform'
import { Slice } from 'prosemirror-model'

const removeFirstParagraphIfEmpty = (slice: ManuscriptSlice) => {
  const firstChild = slice.content.firstChild

  if (
    firstChild &&
    firstChild.type === firstChild.type.schema.nodes.paragraph &&
    firstChild.textContent === ''
  ) {
    return new Slice(
      slice.content.cut(firstChild.nodeSize),
      slice.openStart,
      slice.openEnd
    )
  } else {
    return slice
  }
}

// remove `id` from pasted content
const removeIDs = (slice: ManuscriptSlice) => {
  slice.content.descendants((node) => {
    if (node.attrs.id) {
      // @ts-ignore
      node.attrs.id = null
    }
  })
}

export const transformPasted = (slice: ManuscriptSlice): ManuscriptSlice => {
  const checkedSlice = removeFirstParagraphIfEmpty(slice)

  removeIDs(checkedSlice)

  return checkedSlice
}
