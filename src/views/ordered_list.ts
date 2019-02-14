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

import { EditorProps } from '../components/Editor'
import { NodeViewCreator } from '../types'
import Block from './block'

class OrderedList extends Block {
  protected get elementType() {
    return 'ol'
  }
}

const orderedList = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos,
  decorations
) => {
  for (const decoration of decorations) {
    if (decoration.spec.element) {
      return new OrderedList(props, node, view, getPos)
    }
  }

  const dom = document.createElement('ol')

  if (node.attrs.order !== undefined && node.attrs.order !== 1) {
    dom.setAttribute('start', node.attrs.order)
  }

  return {
    dom,
    contentDOM: dom,
  }
}

export default orderedList
