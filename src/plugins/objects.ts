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
  buildTargets,
  ManuscriptNode,
  schema,
  Target,
} from '@manuscripts/transform'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { findChildren } from 'prosemirror-utils'
import { clear } from '@manuscripts/track-changes-plugin'

export const objectsKey = new PluginKey<Map<string, Target>>('objects')

/**
 * Node types listed here will still be counted and available for cross-references
 * via buildTargets, but will NOT receive an element-label decoration in the editor.
 */
const excludedFromLabelDecoration = new Set([schema.nodes.supplement])

/**
 * This plugin sets the labels for cross-references, and adds the label as a decoration to cross-referenceable elements.
 */
export default () => {
  return new Plugin<Map<string, Target>>({
    key: objectsKey,

    state: {
      init: (config, state) => {
        // Build targets from filtered document to exclude moved nodes
        return buildTargets(clear(state.doc).descendants) // @TODO - make sure binding works ok here - same problem as in transform
      },
      apply: (tr) => {
        // TODO: use decorations to track figure deletion?
        // TODO: map decorations?
        // TODO: use setMeta to update labels

        // Build targets from filtered document to exclude moved nodes
        return buildTargets(clear(tr.doc).descendants)
      },
    },
    props: {
      decorations: (state) => {
        const decorations: Decoration[] = []
        const targets = objectsKey.getState(state)

        if (targets) {
          state.doc.descendants((node, pos) => {
            const { id } = node.attrs
            if (id) {
              const target = targets.get(id)

              if (target && !excludedFromLabelDecoration.has(node.type)) {
                const caption = findChildren(
                  node,
                  (node) =>
                    node.type === schema.nodes.caption ||
                    node.type === schema.nodes.caption_title,
                  false
                )[0]

                if (caption) {
                  let from: number
                  let to: number
                  if (caption.node.type === schema.nodes.caption_title) {
                    from = pos + 1 + caption.pos
                    to = from + caption.node.nodeSize
                  } else {
                    // caption node: decorate its first child (text_block) so the label
                    // appears inline before the caption text
                    const firstChild = caption.node.firstChild
                    from = pos + 1 + caption.pos + 1
                    to = from + (firstChild?.nodeSize || caption.node.nodeSize)
                  }

                  decorations.push(
                    Decoration.node(from, to, {
                      'element-label': target.label,
                    })
                  )
                } else {
                  // No caption at all — fall back to a widget label at the end of the node
                  const labelPos = getDecorationPos(target, state.doc, pos)
                  const labelNode = document.createElement('span')
                  labelNode.className = 'element-label'
                  labelNode.textContent = target.label
                  decorations.push(
                    Decoration.widget(labelPos, labelNode, {
                      side: -1,
                      key: `element-label-${id}-${target.label}`,
                    })
                  )
                }
              }
            }
          })
        }
        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
}

/**
 * Returns the position for a widget decoration when there is no caption.
 * Falls back to the end of the node.
 */
const getDecorationPos = (target: Target, doc: ManuscriptNode, pos: number) => {
  const $pos = doc.resolve(pos + 1)
  return $pos.end()
}
