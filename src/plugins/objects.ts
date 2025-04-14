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
  isInGraphicalAbstractSection,
  Target,
} from '@manuscripts/transform'
import { Fragment } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export const objectsKey = new PluginKey<Map<string, Target>>('objects')

/**
 * This plugin sets the labels for cross-references, and adds the label as a decoration to cross-referenceable elements.
 */
export default () => {
  return new Plugin<Map<string, Target>>({
    key: objectsKey,

    state: {
      init: (config, state) => {
        return buildTargets(Fragment.from(state.doc.content))
      },
      apply: (tr) => {
        // TODO: use decorations to track figure deletion?
        // TODO: map decorations?
        // TODO: use setMeta to update labels

        return buildTargets(Fragment.from(tr.doc.content))
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
              const resolvedPos = state.doc.resolve(pos)
              const isInGraphicalAbstract =
                isInGraphicalAbstractSection(resolvedPos)

              if (target && !isInGraphicalAbstract) {
                const labelNode = document.createElement('span')
                labelNode.className = 'figure-label'

                if (node.type.name === 'image_element') {
                  labelNode.textContent = target.label
                  decorations.push(
                    Decoration.widget(
                      pos + (node.firstChild?.nodeSize || 0) + 1,
                      labelNode
                    )
                  )
                } else {
                  labelNode.textContent = target.label + ':'

                  node.forEach((child, offset) => {
                    if (child.type.name === 'figcaption') {
                      decorations.push(
                        Decoration.widget(pos + 1 + offset + 1, labelNode, {
                          side: -1,
                          key: `figure-label-${id}-${target.label}`,
                        })
                      )
                    }
                  })
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
