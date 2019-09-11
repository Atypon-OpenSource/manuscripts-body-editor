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
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import { Plugin, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

const placeholderWidget = (placeholder: string) => (
  view: ManuscriptEditorView,
  getPos: () => number
) => {
  const element = document.createElement('span')
  element.className = 'placeholder-text'
  element.textContent = placeholder
  element.addEventListener('click', (event: MouseEvent) => {
    event.preventDefault()
    view.dispatch(
      view.state.tr.setSelection(
        TextSelection.create(view.state.tr.doc, getPos())
      )
    )
  })
  return element
}

export default () =>
  new Plugin<{}, ManuscriptSchema>({
    props: {
      decorations: state => {
        const decorations: Decoration[] = []

        const decorate = (node: ManuscriptNode, pos: number) => {
          const { placeholder } = node.attrs

          if (
            placeholder &&
            !node.isAtom &&
            node.type.isBlock &&
            node.childCount === 0
          ) {
            if (node.type === node.type.schema.nodes.paragraph) {
              decorations.push(
                Decoration.widget(pos + 1, placeholderWidget(placeholder))
              )
            } else {
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: 'empty-node',
                })
              )
            }
          }
        }

        state.doc.descendants(decorate)

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
