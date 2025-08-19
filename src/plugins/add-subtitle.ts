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

import { ManuscriptEditorView, schema } from '@manuscripts/transform'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { v4 as uuidv4 } from 'uuid'

import { addAuthorIcon } from '../icons'

const createAddSubtitleButton = (handler: () => void) => {
  const button = document.createElement('span')
  button.className = 'add-subtitle'
  button.innerHTML = `${addAuthorIcon} <span class="add-subtitle-text">Add subtitle</span>`

  button.addEventListener('mousedown', (e) => {
    e.preventDefault()
    handler()
  })

  return button
}

export default () =>
  new Plugin<null>({
    props: {
      decorations: (state) => {
        let titleHasContent = false
        let titlePos = -1
        let hasSubtitle = false

        state.doc.descendants((node, pos) => {
          if (node.type === schema.nodes.title && node.textContent.trim()) {
            titleHasContent = true
            titlePos = pos
          } else if (node.type === schema.nodes.subtitle) {
            hasSubtitle = true
            return false // Stop early if subtitle found
          }
        })

        // Show button only if title has content and no subtitle exists
        if (titleHasContent && !hasSubtitle) {
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

                  view.dispatch(
                    view.state.tr.insert(titleEndPos, subtitlesNode)
                  )
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
