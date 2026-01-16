/*!
 * © 2025 Atypon Systems LLC
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

import { makeKeyboardActivatable } from '@manuscripts/style-guide'
import { ManuscriptEditorView, schema } from '@manuscripts/transform'
import { Plugin, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { v4 as uuidv4 } from 'uuid'

import { addAuthorIcon } from '../icons'
import { findInsertionPosition } from '../lib/utils'

const createAddSubtitleButton = (handler: () => void) => {
  const button = document.createElement('span')
  button.className = 'add-subtitle'
  button.innerHTML = `${addAuthorIcon} <span class="add-subtitle-text">Add subtitle</span>`
  button.tabIndex = 0
  
  // Use makeKeyboardActivatable instead of separate event listeners
  makeKeyboardActivatable(button, handler)

  return button
}

export default () =>
  new Plugin<null>({
    props: {
      decorations: (state) => {
        let titleHasContent = false
        let titlePos = -1
        let hasSubtitles = false

        state.doc.descendants((node, pos) => {
          if (node.type === schema.nodes.title && node.textContent.trim()) {
            titleHasContent = true
            titlePos = pos
          } else if (node.type === schema.nodes.subtitles) {
            hasSubtitles = true
            return false // Stop early if subtitles found
          }
        })

        // Show button only if title has content and no subtitles exist
        if (titleHasContent && !hasSubtitles) {
          const titleNode = state.doc.nodeAt(titlePos)
          if (titleNode) {
            const titleEndPos = titlePos + titleNode.nodeSize

            return DecorationSet.create(state.doc, [
              Decoration.widget(titleEndPos, (view: ManuscriptEditorView) => {
                return createAddSubtitleButton(() => {
                  const subtitlesNode = schema.nodes.subtitles.create(
                    { id: uuidv4() },
                    [schema.nodes.subtitle.create({ id: uuidv4() })]
                  )
                  const pos = findInsertionPosition(
                    schema.nodes.subtitles,
                    state.doc
                  )
                  const tr = view.state.tr.insert(pos, subtitlesNode)
                  const subtitlePos = pos + 1
                  tr.setSelection(TextSelection.create(tr.doc, subtitlePos))

                  view.dispatch(tr)
                  view.focus()
                })
              }),
            ])
          }
        }

        return DecorationSet.empty
      },
    },
  })
