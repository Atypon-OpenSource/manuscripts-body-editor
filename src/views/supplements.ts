/*!
 * © 2025 Atypon Systems LLC
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

import { SupplementsNode } from '@manuscripts/transform'

import { arrowUp } from '../icons'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class SupplementsView extends BlockView<Trackable<SupplementsNode>> {
  private collapsed = false
  private toggleButton: HTMLElement

  public ignoreMutation = () => true

  public createElement = () => {
    this.toggleButton = document.createElement('button')
    this.toggleButton.classList.add('supplements-toggle-btn', 'button-reset')
    this.toggleButton.innerHTML = arrowUp
    this.toggleButton.onclick = () => {
      this.collapsed = !this.collapsed
      this.toggleContent()
      this.toggleButton?.classList.toggle('collapsed', this.collapsed)
    }

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('supplements-content')
    this.contentDOM.classList.add('block')

    this.dom.appendChild(this.toggleButton)
    this.dom.setAttribute('id', this.node.attrs.id)
    this.dom.setAttribute('contentEditable', 'false')
    this.dom.appendChild(this.contentDOM)
  }

  private toggleContent() {
    // Hide/show supplement items
    const supplementItems =
      this.contentDOM?.querySelectorAll('.supplement-item')
    supplementItems?.forEach((item) => {
      const element = item as HTMLElement
      element.style.display = this.collapsed ? 'none' : ''
    })
  }
}

export default createNodeView(SupplementsView)
