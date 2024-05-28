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

import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeOrElementView } from './creators'

export type JatsStyleType = NonNullable<ListElement['listStyleType']>

export const JATS_HTML_LIST_STYLE_MAPPING: {
  [key in JatsStyleType]: string
} = {
  simple: 'none',
  bullet: 'disc',
  order: 'decimal',
  'alpha-lower': 'lower-alpha',
  'alpha-upper': 'upper-alpha',
  'roman-lower': 'lower-roman',
  'roman-upper': 'upper-roman',
}

export class ListView<
  PropsType extends BaseNodeProps
> extends BlockView<PropsType> {
  public elementType = 'ul'

  static getElementType: () => string = () => this.prototype.elementType

  public initialise = () => {
    this.createDOM()
    this.createGutter('block-gutter', this.gutterButtons().filter(Boolean))
    this.createElement()
    this.createGutter(
      'action-gutter',
      this.actionGutterButtons().filter(Boolean)
    )
    this.updateContents()
  }

  public updateContents = () => {
    if (this.contentDOM) {
      this.elementType = this.node.attrs.type === 'bullet' ? 'ul' : 'ol'
      const type =
        (this.node.attrs.listStyleType as JatsStyleType) || this.node.attrs.type
      this.contentDOM.style.listStyleType = JATS_HTML_LIST_STYLE_MAPPING[type]

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

  public createElement = () => {
    this.elementType = this.node.attrs.type === 'bullet' ? 'ul' : 'ol'
    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.className = 'block'

    this.dom.appendChild(this.contentDOM)
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
  const type = (node.attrs.listStyleType as JatsStyleType) || node.attrs.type
  dom.style.listStyleType = JATS_HTML_LIST_STYLE_MAPPING[type]
}
export default createNodeOrElementView(
  ListView,
  ListView.getElementType(),
  ListCallback
)
