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
  schema,
  SectionCategory,
  SectionNode,
  SectionTitleNode,
} from '@manuscripts/transform'
import { EditorState } from 'prosemirror-state'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'

import { sectionTitles } from '../../lib/section-titles'
import {
  getActualAttrs,
  getActualTextContent,
} from '../../lib/track-changes-utils'

function cursorAtTheEndOfText(
  state: EditorState,
  nodeSize: number,
  nodePos: number
) {
  const { from, to } = state.selection
  return from === to && to === nodePos + nodeSize - 1
}

const isUpperCase = (test: string) =>
  test === test.toUpperCase() && test.length > 1

export function hasAutoCompletionSlack(
  parentSection: SectionNode,
  titleSection: SectionTitleNode
) {
  const category = getActualAttrs(parentSection).category as SectionCategory
  const title = sectionTitles.get(category)
  if (
    category &&
    title &&
    titleSection.textContent
    // title.startsWith(titleSection.textContent)
  ) {
    const actualTextContent = getActualTextContent(titleSection.content)
    console.log('actualTextContent')
    console.log(actualTextContent)
    if (title.toLowerCase().startsWith(actualTextContent.toLowerCase())) {
      const suggestionText = title.slice(actualTextContent.length)
      return isUpperCase(actualTextContent)
        ? suggestionText.toUpperCase()
        : suggestionText
    }
  }
  return ''
}

export function checkForCompletion(state: EditorState) {
  const section = findParentNodeOfTypeClosestToPos(
    state.selection.$from,
    schema.nodes.section
  )
  const title = findParentNodeOfTypeClosestToPos(
    state.selection.$from,
    schema.nodes.section_title
  )
  if (
    section &&
    title &&
    cursorAtTheEndOfText(state, title.node.nodeSize, title.pos)
  ) {
    const text = hasAutoCompletionSlack(
      section.node as SectionNode,
      title.node as SectionTitleNode
    )
    console.log('returnable text')
    console.log(text)
    return text
  }
  return ''
}
