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

import { isSectionNodeType, schema } from '@manuscripts/transform'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

/**
 * This plugin simply sets `element: true` in a Decoration spec for each element (a non-section node that is a child of a section).
 * `createNodeOrElementView` uses this to decide whether to create a NodeView or just a regular DOM element.
 * This is useful for paragraphs and lists, for example, which may be nested inside top-level elements of the same node type.
 */
export default () => {
  return new Plugin<null>({
    props: {
      decorations: (state) => {
        const { section } = state.schema.nodes

        const decorations: Decoration[] = []

        // TODO: only calculate these when something changes

        state.doc.descendants((node, pos, parent) => {
          if (
            parent &&
            (isSectionNodeType(parent.type) || parent.type === schema.nodes.body) &&
            node.type !== section
          ) {
            decorations.push(
              Decoration.node(
                pos,
                pos + node.nodeSize,
                {},
                {
                  element: true,
                }
              )
            )
          }
        })

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
}
