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

import { ManuscriptNode } from '@manuscripts/manuscript-transform'
import { EditorBaseProps } from '../components/EditorBase'
import { ViewerBaseProps } from '../components/Viewer'
import { NodeViewCreator } from '../types'
import { BaseNodeView } from './base_node_view'

export const createNodeView = <T extends BaseNodeView<ViewerBaseProps>>(
  type: new (...args: any[]) => T // tslint:disable-line:no-any
) => (props: ViewerBaseProps): NodeViewCreator<T> => (node, view, getPos) => {
  const nodeView = new type(props, node, view, getPos)

  nodeView.initialise()

  return nodeView
}

export const createEditableNodeView = <T extends BaseNodeView<EditorBaseProps>>(
  type: new (...args: any[]) => T // tslint:disable-line:no-any
) => (props: EditorBaseProps): NodeViewCreator<T> => (node, view, getPos) => {
  const nodeView = new type(props, node, view, getPos)

  nodeView.initialise()

  return nodeView
}

export const createNodeOrElementView = <
  T extends BaseNodeView<ViewerBaseProps>
>(
  type: new (...args: any[]) => T, // tslint:disable-line:no-any
  tagName: string,
  callback?: (node: ManuscriptNode, dom: HTMLElement) => void
) => (props: ViewerBaseProps): NodeViewCreator<T> => (
  node,
  view,
  getPos,
  decorations
) => {
  // TODO: look for parent Section instead?

  for (const decoration of decorations) {
    if (decoration.spec.element) {
      const nodeView = new type(props, node, view, getPos)

      nodeView.initialise()

      return nodeView
    }
  }

  const dom = document.createElement(tagName)

  if (callback) {
    callback(node, dom)
  }

  const nodeView = {
    dom,
    contentDOM: dom,
  }

  return nodeView as T
}
