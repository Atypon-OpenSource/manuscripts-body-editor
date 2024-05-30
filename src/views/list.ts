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

import { ListElement } from '@manuscripts/json-schema'
import { ManuscriptNode } from '@manuscripts/transform'

import { getActualAttrs } from '../lib/track-changes-utils'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeOrElementView } from './creators'

export type JatsStyleType = NonNullable<ListElement['listStyleType']>

export const JATS_HTML_LIST_STYLE_MAPPING: {
  [key in JatsStyleType]: { style: string; type: string }
} = {
  simple: { style: 'none', type: 'ul' },
  bullet: { style: 'disc', type: 'ul' },
  order: { style: 'decimal', type: 'ol' },
  'alpha-lower': { style: 'lower-alpha', type: 'ol' },
  'alpha-upper': { style: 'upper-alpha', type: 'ol' },
  'roman-lower': { style: 'lower-roman', type: 'ol' },
  'roman-upper': { style: 'upper-roman', type: 'ol' },
}

export class ListView<
  PropsType extends BaseNodeProps
> extends BlockView<PropsType> {
  public elementType = 'ul'

  static getElementType: () => string = () => this.prototype.elementType

  public updateContents = () => {
    const actualAttrs = getActualAttrs(this.node)

    if (this.contentDOM) {
      const type = actualAttrs.listStyleType as JatsStyleType
      this.elementType = JATS_HTML_LIST_STYLE_MAPPING[type].type
      this.contentDOM.style.listStyleType =
        JATS_HTML_LIST_STYLE_MAPPING[type].style

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
  dom.style.listStyleType = JATS_HTML_LIST_STYLE_MAPPING[type].style
}
export default createNodeOrElementView(
  ListView,
  ListView.getElementType(),
  ListCallback
)
