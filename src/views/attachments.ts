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

import { ManuscriptNode } from '@manuscripts/transform'

import { arrowUp } from '../icons'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class AttachmentsView extends BlockView<Trackable<ManuscriptNode>> {
  private container: HTMLElement
  private collapsed = false

  public ignoreMutation = () => true

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block', 'attachments-container')
    this.dom.appendChild(this.container)

    this.container.appendChild(this.createPanel())

    const content = document.createElement('div')
    content.className = 'attachments-content'

    this.container.appendChild(content)
    this.contentDOM = content
  }

  createPanel() {
    const panel = document.createElement('div')
    panel.classList.add('panel-header')

    const label = document.createElement('span')
    label.textContent = 'Main Document'
    label.contentEditable = 'false'

    const toggleBtn = document.createElement('button')
    toggleBtn.classList.add('toggle-btn', 'button-reset')

    toggleBtn.innerHTML = arrowUp
    toggleBtn.classList.toggle('collapsed', this.collapsed)

    toggleBtn.onclick = () => {
      this.collapsed = !this.collapsed
      if (this.contentDOM) {
        this.contentDOM.style.display = this.collapsed ? 'none' : ''
      }
      toggleBtn.classList.toggle('collapsed', this.collapsed)
    }

    panel.appendChild(label)
    panel.appendChild(toggleBtn)
    return panel
  }

  public gutterButtons(): HTMLElement[] {
    // this to avoid issue of LEAN-4986
    return [document.createElement('div')]
  }
}

export default createNodeView(AttachmentsView)
