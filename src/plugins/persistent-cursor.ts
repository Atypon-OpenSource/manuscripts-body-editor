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

import { ManuscriptEditorView } from '@manuscripts/transform'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export const persistentCursor = new PluginKey<{on: boolean}>('persistent-cursor')

/**
 * This plugin creates a fake text cursor when the editor is out of focus for better UX.
 */
export default () => {
  return new Plugin({
    state: {
      init(_, state) {
        return { on: false }
      },
      apply(tr, value) {
        if (tr.getMeta(persistentCursor)) {
          return tr.getMeta(persistentCursor)
        }
        return value
      }
    },
    props: {
      decorations(state) {
        const selection = state.selection;
        if (this.getState(state)?.on && selection.from === selection.to) {
          
          const decorations =  [Decoration.widget(selection.to,
                        (view: ManuscriptEditorView) => {
                          const cursor = document.createElement("span")
                          cursor.classList.add("cursor-placeholder")
                          return cursor
                        },)]
          return DecorationSet.create(state.doc, decorations)
          
        }
        return DecorationSet.empty
      },
      handleDOMEvents: {
        focus(view, event) {
          const newTr = view.state.tr.setMeta(persistentCursor, { on: false })
          view.dispatch(newTr)
        },
        blur(view, event) {
          const newTr = view.state.tr.setMeta(persistentCursor, { on: true })
          view.dispatch(newTr)
          // create decoration for fake cursor    
        },
      },
    },
  })
}
