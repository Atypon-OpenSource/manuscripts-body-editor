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
  isFootnoteNode,
  isGeneralTableFootnoteNode,
  ManuscriptEditorView,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { Plugin, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

const placeholderWidget =
  (placeholder: string) =>
  (view: ManuscriptEditorView, getPos: () => number | undefined) => {
    const element = document.createElement('span')
    element.className = 'placeholder-text'
    element.textContent = placeholder
    element.addEventListener('click', (event: MouseEvent) => {
      event.preventDefault()
      const pos = getPos() as number
      const selection = TextSelection.create(view.state.tr.doc, pos)
      view.dispatch(view.state.tr.setSelection(selection))
    })
    return element
  }

const getParagraphPlaceholderText = (parent: ManuscriptNode | null) => {
  if (!parent || parent.textContent.length) {
    return
  }
  if (parent.type === schema.nodes.body) {
    return 'Paragraph'
  }
  if (isFootnoteNode(parent) || isGeneralTableFootnoteNode(parent)) {
    return 'Type new footnote here'
  }
}

/**
 * This plugin adds a placeholder decoration to empty nodes
 */
export default () =>
  new Plugin<null>({
    props: {
      decorations: (state) => {
        const decorations: Decoration[] = []

        state.doc.descendants((node, pos, parent) => {
          if (!node.isAtom && node.type.isBlock && node.childCount === 0) {
            if (node.type === node.type.schema.nodes.paragraph) {
              const text = getParagraphPlaceholderText(parent)
              if (text) {
                decorations.push(
                  Decoration.widget(pos + 1, placeholderWidget(text))
                )
              }
            } else {
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: 'empty-node',
                })
              )
            }
          }
        })

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
