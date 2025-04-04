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

import { LockIcon } from '@manuscripts/style-guide'
import { schema } from '@manuscripts/transform'
import { Node } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { isBodyLocked, isSelectionInBody } from '../lib/utils'

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
          div.innerHTML = renderToStaticMarkup(createElement(LockIcon))
          div.className = 'icon'
          return div
        })
      )
    }
  })
  return decorations
}
