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
  getListType,
  JatsStyleType,
  ManuscriptNode,
} from '@manuscripts/transform'

import { getActualAttrs } from '../lib/track-changes-utils'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeOrElementView } from './creators'
import { EditableBlock } from './editable_block'
export class ListView<
  PropsType extends BaseNodeProps
> extends BlockView<PropsType> {
  public updateContents = () => {
    const actualAttrs = getActualAttrs(this.node)

    if (this.contentDOM) {
      const type = actualAttrs.listStyleType as JatsStyleType
      this.elementType = getListType(type).type
      this.contentDOM.style.listStyleType = getListType(type).style

      // Check and update the element type if necessary
      if (this.contentDOM.nodeName.toLowerCase() !== this.elementType) {
        this.updateElementType()
      }
    }

    if (this.node.attrs.dataTracked?.length) {
      this.dom.setAttribute(
        'data-track-status',
        this.node.attrs.dataTracked[0].status
      )
      this.dom.setAttribute(
        'data-track-op',
        this.node.attrs.dataTracked[0].operation
      )
    } else {
      this.dom.removeAttribute('data-track-status')
      this.dom.removeAttribute('data-track-type')
    }
  }

  private updateElementType = () => {
    const newElement = document.createElement(this.elementType)
    newElement.className = 'block'
    if (this.contentDOM) {
      while (this.contentDOM.firstChild) {
        newElement.appendChild(this.contentDOM.firstChild)
      }

      this.dom.replaceChild(newElement, this.contentDOM)
      this.contentDOM = newElement
    }
  }
}

export const ListCallback = (node: ManuscriptNode, dom: HTMLElement) => {
  dom.classList.add('list')
  const type = node.attrs.listStyleType as JatsStyleType
  dom.style.listStyleType = getListType(type).style
}
export default createNodeOrElementView(
  EditableBlock(ListView),
  'div',
  ListCallback
)
