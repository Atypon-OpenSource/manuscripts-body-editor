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

import { ManuscriptNode } from '@manuscripts/transform'

import { Dispatch } from '../commands'
import { EditorProps } from '../configs/ManuscriptsEditor'
import { NodeViewCreator } from '../types'
import { BaseNodeView } from './base_node_view'
import { addTrackChangesAttributes } from '@manuscripts/track-changes-plugin'

export const createEditableNodeView =
  <T extends BaseNodeView<ManuscriptNode>>(
    type: new (...args: any[]) => T // eslint-disable-line @typescript-eslint/no-explicit-any
  ) =>
  (props: EditorProps, dispatch?: Dispatch): NodeViewCreator<T> =>
  (node, view, getPos, decorations) => {
    const nodeView = new type(
      { ...props, dispatch },
      node,
      view,
      getPos,
      decorations
    )

    nodeView.initialise()

    return nodeView
  }

export const createNodeView = createEditableNodeView

export const createNodeOrElementView =
  <T extends BaseNodeView<ManuscriptNode>>(
    type: new (...args: any[]) => T, // eslint-disable-line @typescript-eslint/no-explicit-any
    tagName: string,
    callback?: (node: ManuscriptNode, dom: HTMLElement) => void
  ) =>
  (props: EditorProps): NodeViewCreator<T> =>
  (node, view, getPos, decorations) => {
    // TODO: look for parent Section instead?

    for (const decoration of decorations) {
      if (decoration.spec.element) {
        const nodeView = new type(props, node, view, getPos, decorations)

        nodeView.initialise()

        return nodeView
      }
    }

    const dom = document.createElement(tagName)

    if (callback) {
      callback(node, dom)
    }
    if (node.attrs.id) {
      dom.id = node.attrs.id
    }
    addTrackChangesAttributes(node.attrs, dom)

    const nodeView = {
      dom,
      contentDOM: dom,
    }

    return nodeView as T
  }
