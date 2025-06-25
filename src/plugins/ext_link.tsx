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
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'
import React from 'react'
import ReactDOM from 'react-dom/client'

import { ExtLinkEditor } from '../components/views/ExtLinkEditor'
import { EditorProps } from '../configs/ManuscriptsEditor'

const pluginKey = new PluginKey('extLinkPlugin')

export default (props: EditorProps) =>
  new Plugin({
    key: pluginKey,

    state: {
      init() {
        return DecorationSet.empty // We'll create it later in view()
      },
      apply(tr, old, _, newState) {
        const newDecoSet = tr.getMeta(pluginKey)
        return newDecoSet || old
      },
    },

    props: {
      decorations(state) {
        return pluginKey.getState(state)
      },
    },

    view(editorView) {
      setTimeout(() => {
        const decoSet = DecorationSet.create(
          editorView.state.doc,
          getDecorations(editorView.state, props, editorView)
        )
        editorView.dispatch(editorView.state.tr.setMeta(pluginKey, decoSet))
      }, 0)

      return {
        update(view, prevState) {
          if (!imageElementsChanged(prevState.doc, view.state.doc)) {
            return
          }

          if (view.state.doc !== prevState.doc) {
            const decoSet = DecorationSet.create(
              view.state.doc,
              getDecorations(view.state, props, view)
            )
            view.dispatch(view.state.tr.setMeta(pluginKey, decoSet))
          }
        },
      }
    },
  })

const getDecorations = (
  state: EditorState,
  props: EditorProps,
  editorView?: EditorView
): Decoration[] => {
  const decorations: Decoration[] = []

  state.doc.descendants((node, pos) => {
    if (node.type === schema.nodes.image_element) {
      decorations.push(
        Decoration.widget(
          pos + node.nodeSize - 1,
          () => {
            const mount = document.createElement('div')
            mount.className = 'ext-link-editor-container'

            const root = ReactDOM.createRoot(mount)

            const onUpdate = (newAttrs: { extLink: string }) => {
              if (!editorView) {
                return
              }
              const tr = editorView.state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                ...newAttrs,
              })
              editorView.dispatch(tr)
            }

            root.render(
              <ExtLinkEditor
                id={node.attrs.id || ''}
                extLink={node.attrs.extLink || ''}
                onUpdate={onUpdate}
                editorProps={props}
              />
            )

            return mount
          },
          { side: 0 }
        )
      )
    }
  })

  return decorations
}

const imageElementsChanged = (prevDoc: Node, nextDoc: Node) => {
  let changed = false
  nextDoc.descendants((node, pos) => {
    if (node.type === schema.nodes.image_element) {
      const prevNode = prevDoc.nodeAt(pos)
      if (!prevNode || !prevNode.eq(node)) {
        changed = true
        return false // stop early
      }
    }
  })
  return changed
}
