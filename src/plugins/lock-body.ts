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

import { schema } from '@manuscripts/transform'
import { Node } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { lockIcon } from '../icons'
import { isBodyLocked, isSelectionInBody } from '../lib/utils'

/**
 * This plugin prevents editing in the body of the document when it is locked.
 * It also adds a lock icon to indicate that the body is non-editable.
 */
export default () => {
  return new Plugin({
    state: {
      init(_, state) {
        const decorations = isBodyLocked(state) ? getDecorations(state.doc) : []
        return DecorationSet.create(state.doc, decorations)
      },
      apply(tr, oldDecorationSet, oldState, newState) {
        if (
          tr.docChanged ||
          isBodyLocked(oldState) !== isBodyLocked(newState)
        ) {
          const decorations = isBodyLocked(newState)
            ? getDecorations(newState.doc)
            : []
          return DecorationSet.create(newState.doc, decorations)
        }
        return oldDecorationSet
      },
    },
    props: {
      decorations(state) {
        return this.getState(state) || DecorationSet.empty
      },
      handleDOMEvents: {
        beforeinput(view, event) {
          if (isSelectionInBody(view.state) && isBodyLocked(view.state)) {
            event.preventDefault()
            return true
          }
          return false
        },
        keydown(view, event) {
          if (isSelectionInBody(view.state) && isBodyLocked(view.state)) {
            event.preventDefault()
            return true
          }
          return false
        },
        paste(view, event) {
          if (isSelectionInBody(view.state) && isBodyLocked(view.state)) {
            event.preventDefault()
            return true
          }
          return false
        },
      },
      handleClickOn: (view, pos, node, nodePos, event) => {
        if (isSelectionInBody(view.state) && isBodyLocked(view.state)) {
          event.preventDefault()
          return true
        }
        return false
      },
      handleTripleClickOn: (view, pos, node, nodePos, event) => {
        event.preventDefault()
        return true
      },
    },
  })
}

const getDecorations = (doc: Node): Decoration[] => {
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    if (node.type === schema.nodes.body) {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, { class: 'non-editable' })
      )

      decorations.push(
        Decoration.widget(pos + 1, () => {
          const div = document.createElement('div')
          div.innerHTML = lockIcon
          div.className = 'icon'
          return div
        })
      )

      decorations.push(
        Decoration.widget(
          pos + 1,
          () => {
            const overlay = document.createElement('div')
            overlay.className = 'body-overlay'
            return overlay
          },
          { side: 1 }
        )
      )
    }

    if (node.type.name === 'figure') {
      decorations.push(
        Decoration.widget(
          pos + 1,
          () => {
            const overlay = document.createElement('div')
            overlay.className = 'figure-overlay'
            return overlay
          },
          { side: 1 }
        )
      )
    }
  })
  return decorations
}
