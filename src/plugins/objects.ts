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
  ManuscriptNode,
  schema,
  Target,
} from '@manuscripts/transform'
import { Fragment } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { getDocWithoutMovedContent } from '../lib/filtered-document'
import { findChildren } from 'prosemirror-utils'

export const objectsKey = new PluginKey<Map<string, Target>>('objects')

/**
 * This plugin sets the labels for cross-references, and adds the label as a decoration to cross-referenceable elements.
 */
export default () => {
  return new Plugin<Map<string, Target>>({
    key: objectsKey,

    state: {
      init: (config, state) => {
        // Build targets from filtered document to exclude moved nodes
        const filteredDoc = getDocWithoutMovedContent(state.doc)
        return buildTargets(Fragment.from(filteredDoc.content))
      },
      apply: (tr) => {
        // TODO: use decorations to track figure deletion?
        // TODO: map decorations?
        // TODO: use setMeta to update labels

        // Build targets from filtered document to exclude moved nodes
        const filteredDoc = getDocWithoutMovedContent(tr.doc)
        return buildTargets(Fragment.from(filteredDoc.content))
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

              if (target) {
                const labelNode = document.createElement('span')
                labelNode.className = 'element-label'
                const { labelPos, label } = getLabelDecorationData(
                  target,
                  state.doc,
                  node,
                  pos
                )
                labelNode.textContent = label
                decorations.push(
                  Decoration.widget(labelPos, labelNode, {
                    side: -1,
                    key: `element-label-${id}-${target.label}`,
                  })
                )
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
 * this function return:
 * - `label` with colon if block element have a caption or caption_title
 * - position of the decoration will be before a caption or caption_title,
 *   or if we don't have at all caption will be at the end of node
 */
const getLabelDecorationData = (
  target: Target,
  doc: ManuscriptNode,
  parent: ManuscriptNode,
  pos: number
) => {
  const caption = findChildren(
    parent,
    (node) =>
      node.type === schema.nodes.caption ||
      node.type === schema.nodes.caption_title,
    false
  )[0]

  const $pos = doc.resolve(pos + (caption?.pos || 1) + 1)
  let labelPos = $pos.pos,
    label = target.label + ':'
  if (!caption) {
    labelPos = $pos.end()
    label = target.label
  } else if (!$pos.nodeBefore) {
    // this for the case of table as caption will be first element
    // that will make sure it stays before caption
    labelPos -= 1
  }

  return { labelPos, label }
}
