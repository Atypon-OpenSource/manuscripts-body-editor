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

import {
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptSlice,
  ParagraphNode,
  SectionTitleNode,
} from '@manuscripts/transform'
import { EditorView } from 'prosemirror-view'

import { insertSection } from '../commands'

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

// remove `id` from pasted content
const removeIDs = (slice: ManuscriptSlice) => {
  slice.content.descendants((node) => {
    if (node.attrs.id) {
      // @ts-ignore
      node.attrs.id = null
    }
  })
}

const pasteSection = (slice: ManuscriptSlice, view: ManuscriptEditorView) => {
  const { state, dispatch } = view
  let sectionTitleNode: ManuscriptNode | null = null
  const sectionBodyNodes: ManuscriptNode[] = []
  ClipboardEvent

  slice.content.descendants((node) => {
    if (node.type === node.type.schema.nodes.section) {
      node.content.forEach((item) => {
        const sectionBodyNode = state.schema.nodes.paragraph.create(
          {},
          item.content
        ) as ParagraphNode

        sectionBodyNodes.push(sectionBodyNode)
      })
    } else if (
      node.type === node.type.schema.nodes.section_title &&
      node.content.childCount === 1
    ) {
      sectionTitleNode = state.schema.nodes.section_title.create(
        {},
        node.content
      ) as SectionTitleNode
    }
  })
  if (sectionTitleNode) {
    const pastedSectionContents = [sectionTitleNode, ...sectionBodyNodes]
    insertSection(false, pastedSectionContents)(state, dispatch, view)
    event?.preventDefault() // stop other pasting handlers
    event?.stopPropagation()
  }
}

export const transformPasted = (
  slice: ManuscriptSlice,
  view: EditorView
): ManuscriptSlice => {
  pasteSection(slice, view)

  removeFirstParagraphIfEmpty(slice)

  removeIDs(slice)

  return slice
}
