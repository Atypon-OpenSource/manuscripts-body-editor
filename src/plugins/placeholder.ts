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
  isPullquoteElement,
  ManuscriptEditorView,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { Plugin, TextSelection } from 'prosemirror-state'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'
import { Decoration, DecorationSet } from 'prosemirror-view'

const placeholderMap: Record<string, string> = {
  subtitle: 'Type subtitle here...',
}

const placeholderWidget =
  (placeholder: string) =>
  (view: ManuscriptEditorView, getPos: () => number | undefined) => {
    const element = document.createElement('span')
    element.className = 'placeholder-text'
    element.setAttribute('aria-hidden', 'true')
    element.dataset.placeholder = placeholder
    element.addEventListener('click', (event: MouseEvent) => {
      event.preventDefault()
      const pos = getPos() as number
      const selection = TextSelection.create(view.state.tr.doc, pos)
      view.dispatch(view.state.tr.setSelection(selection))
    })
    return element
  }

const backmatterWidget = (direction: 'top' | 'bottom') => {
  const element = document.createElement('div')
  element.className = 'backmatter-border-placeholder'
  const line = document.createElement('div')
  line.className = direction
  element.appendChild(line)
  return element
}

const getParagraphPlaceholderText = (
  parent: ManuscriptNode | null,
  node: ManuscriptNode
) => {
  if (!parent) {
    return
  }
  if (isPullquoteElement(parent) && !node.textContent.length) {
    let otherParagraphHasContent = false
    parent.descendants((child) => {
      if (child !== node && child.type === child.type.schema.nodes.paragraph) {
        otherParagraphHasContent = true
      }
    })
    if (otherParagraphHasContent) {
      return
    }
    return 'Insert pull quote here'
  }
  if (parent.textContent.length) {
    return
  }
  if (parent.type === schema.nodes.body) {
    return 'Start typing here...'
  }
  if (isFootnoteNode(parent) || isGeneralTableFootnoteNode(parent)) {
    return 'Type new footnote here'
  }
  if (parent.type === schema.nodes.trans_abstract) {
    return 'Type here'
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
            if (node.type === node.type.schema.nodes.attribution) {
              decorations.push(
                Decoration.widget(
                  pos + 1,
                  placeholderWidget('Insert reference here')
                )
              )
            }
            if (node.type === node.type.schema.nodes.paragraph) {
              const text = getParagraphPlaceholderText(parent, node)
              if (text) {
                decorations.push(
                  Decoration.widget(pos + 1, placeholderWidget(text))
                )
              }
            } else if (node.type === node.type.schema.nodes.section_title) {
              const $pos = state.doc.resolve(pos)

              let placeholderText = 'Type heading here'

              const boxElement = findParentNodeOfTypeClosestToPos(
                $pos,
                schema.nodes.box_element
              )

              if (boxElement) {
                const section = findParentNodeOfTypeClosestToPos(
                  $pos,
                  schema.nodes.section
                )

                // If the section is a direct child of the box_element,
                // it's the top-level section and should have the box placeholder
                if (section && section.depth === boxElement.depth + 1) {
                  placeholderText = 'Optional box title...'
                }
              }

              if (
                findParentNodeOfTypeClosestToPos($pos, schema.nodes.supplements)
              ) {
                placeholderText = 'Supplements'
              }

              decorations.push(
                Decoration.widget(pos + 1, placeholderWidget(placeholderText))
              )
            } else if (node.type === node.type.schema.nodes.trans_abstract) {
              decorations.push(
                Decoration.widget(
                  pos + 1,
                  placeholderWidget('Type new abstract title here')
                )
              )
            } else {
              const placeholder = placeholderMap[node.type.name]
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: 'empty-node',
                  ...(placeholder && { 'data-placeholder': placeholder }),
                })
              )
            }
          } else if (node.type === schema.nodes.backmatter) {
            decorations.push(
              Decoration.widget(pos + 1, backmatterWidget('top'))
            )
            const nextNode = parent && parent.nodeAt(pos + node.nodeSize)
            if (
              nextNode &&
              (nextNode.type === schema.nodes.supplements ||
                nextNode.type === schema.nodes.hero_image ||
                nextNode.type === schema.nodes.attachments)
            ) {
              decorations.push(
                Decoration.widget(
                  pos + node.nodeSize - 1,
                  backmatterWidget('bottom')
                )
              )
            }
          }
        })

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
