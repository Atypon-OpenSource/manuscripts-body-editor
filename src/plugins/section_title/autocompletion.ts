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
import { ManuscriptNode, schema, SectionCategory } from '@manuscripts/transform'
import { EditorState } from 'prosemirror-state'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'

import { getEditorProps } from '../editor-props'
import { getActualTextContent } from '@manuscripts/track-changes-plugin'

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
  node: ManuscriptNode,
  category: SectionCategory
) {
  const titles = category.titles

  if (titles.length && node.textContent) {
    const actualTextContent = getActualTextContent(node.content)
    const title = titles.find((t) =>
      t.toLowerCase().startsWith(actualTextContent.toLowerCase())
    )

    if (title) {
      const suggestionPart = title.slice(actualTextContent.length)
      const suggestion = isUpperCase(actualTextContent)
        ? suggestionPart.toUpperCase()
        : suggestionPart
      return {
        suggestion,
        title: isUpperCase(actualTextContent) ? title.toUpperCase() : title,
      }
    }
  }
  return null
}

export function checkForCompletion(state: EditorState) {
  const section = findParentNodeOfTypeClosestToPos(
    state.selection.$from,
    schema.nodes.section
  )
  if (!section) {
    return
  }

  const title = findParentNodeOfTypeClosestToPos(
    state.selection.$from,
    schema.nodes.section_title
  )
  if (!title || !cursorAtTheEndOfText(state, title.node.nodeSize, title.pos)) {
    return
  }

  const props = getEditorProps(state)
  const category = props.sectionCategories.get(section.node.attrs.category)

  if (category) {
    const text = hasAutoCompletionSlack(title.node, category)
    if (text) {
      return text
    }
  }
}
