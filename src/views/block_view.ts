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

import { ManuscriptNodeView } from '@manuscripts/manuscript-transform'
import { Properties } from 'csstype'
import { ViewerProps } from '../components/Viewer'
import { BaseNodeView } from './base_node_view'

export default class BlockView<T extends ViewerProps> extends BaseNodeView<T>
  implements ManuscriptNodeView {
  public viewAttributes = ['id', 'placeholder', 'paragraphStyle']
  // public readonly icons = {
  //   plus:
  //     '<svg width="16" height="16" stroke="currentColor"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>',
  //   circle:
  //     '<svg width="16" height="16" stroke="currentColor"><circle r="4" cx="8" cy="8"/></svg>',
  //   attention: `<svg width="24" height="24"><g fill="none" fill-rule="evenodd">
  //     <circle fill="#E28327" cx="12" cy="18.7" r="1"></circle>
  //     <rect fill="#E28327" x="11.12" y="7.5" width="1.8" height="9" rx="0.9"></rect>
  //     <path d="M12.901 1.98l9.41 19.587a1 1 0 0 1-.9 1.433H2.59a1 1 0 0 1-.901-1.433l9.41-19.586a1 1 0 0 1 1.802 0z" stroke="#E28327" stroke-width="1.5"></path>
  //   </g></svg>`,
  // }

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
    this.contentDOM.classList.toggle('empty-node', !this.node.childCount)
    this.updateAttributes()
  }

  public updateAttributes = () => {
    for (const key of this.viewAttributes) {
      if (key in this.node.attrs) {
        const value = this.node.attrs[key]

        if (value) {
          this.contentDOM.setAttribute(key, value)
        } else {
          this.contentDOM.removeAttribute(key)
        }
      }
    }
  }

  public createElement = () => {
    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.className = 'block'

    this.dom.appendChild(this.contentDOM)
  }

  public applyStyles = (node: HTMLElement, styles: Properties) => {
    Object.entries(styles).forEach(([key, value]) => {
      node.style.setProperty(key, value)
    })
  }

  public createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('block-container')
    this.dom.classList.add(`block-${this.node.type.name}`)
  }

  public createGutter = (className: string, buttons: HTMLElement[]) => {
    const gutter = document.createElement('div')
    gutter.setAttribute('contenteditable', 'false')
    gutter.classList.add(className)

    for (const button of buttons) {
      gutter.appendChild(button)
    }

    this.dom.appendChild(gutter)
  }

  public gutterButtons = (): HTMLElement[] => []

  public actionGutterButtons = (): HTMLElement[] => []
}
