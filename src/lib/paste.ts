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

import { ManuscriptSlice, schema } from '@manuscripts/transform'
import { Fragment } from 'prosemirror-model'

const removeFirstParagraphIfEmpty = (slice: ManuscriptSlice) => {
  const firstChild = slice.content.firstChild

  if (
    firstChild &&
    firstChild.type === firstChild.type.schema.nodes.paragraph &&
    firstChild.textContent === ''
  ) {
    // @ts-ignore
    slice.content = slice.content.cut(firstChild.nodeSize)
  }
}

const wrapInText = (slice: ManuscriptSlice) => {
  let hasTextWithMarks = false

  // Traverse the content to find if any text node has marks
  slice.content.descendants((node) => {
    if (node.isText && node.marks.length > 0) {
      hasTextWithMarks = true
    }
  })

  // Check if the first child is a paragraph and if any text node has marks
  if (
    slice.content.firstChild?.type === schema.nodes.paragraph &&
    hasTextWithMarks
  ) {
    // Wrap the content in a new paragraph
    // @ts-ignore
    slice.content = Fragment.from(
      schema.nodes.paragraph.create({}, slice.content)
    )
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
  wrapInText(slice)
  removeFirstParagraphIfEmpty(slice)

  removeIDs(slice)

  return slice
}
