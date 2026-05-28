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
import { handleEnterKey } from '../lib/navigation-utils'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class SupplementsView extends BlockView<Trackable<SupplementsNode>> {
  private collapsed = false
  private toggleButton: HTMLButtonElement

  public ignoreMutation = () => true

  public createElement = () => {
    this.toggleButton = document.createElement('button')
    this.toggleButton.classList.add(
      'supplements-toggle-btn',
      'supplements-section-toggle',
      'button-reset'
    )
    this.toggleButton.setAttribute('aria-label', 'Toggle supplementary elements')
    this.toggleButton.setAttribute('aria-expanded', 'true')
    this.toggleButton.innerHTML = arrowUp
    const handleToggle = () => {
      this.collapsed = !this.collapsed
      this.toggleButton?.classList.toggle('collapsed', this.collapsed)
      this.toggleButton?.setAttribute(
        'aria-expanded',
        this.collapsed ? 'false' : 'true'
      )
      this.toggleContent()
    }

    this.toggleButton.onclick = handleToggle
    this.toggleButton.addEventListener('keydown', handleEnterKey(handleToggle))

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('supplements-content')
    this.contentDOM.classList.add('block')

    this.dom.setAttribute('id', this.node.attrs.id)
    this.dom.appendChild(this.contentDOM)
  }

  public update(newNode: import('@manuscripts/transform').ManuscriptNode) {
    if (newNode.type.name !== this.node.type.name) {
      return false
    }
    this.node = newNode as Trackable<SupplementsNode>
    this.updateContents()
    return true
  }

  public updateContents() {
    super.updateContents()
    this.placeToggleInSectionHeader()
  }

  private placeToggleInSectionHeader() {
    const header = this.contentDOM?.querySelector(
      '.block-section_title h1'
    ) as HTMLElement | null
    if (!header || header.contains(this.toggleButton)) {
      return
    }
    header.appendChild(this.toggleButton)
  }

  private toggleContent() {
    const supplementItems =
      this.contentDOM?.querySelectorAll('.supplement-item')
    supplementItems?.forEach((item) => {
      const element = item as HTMLElement
      element.style.display = this.collapsed ? 'none' : ''
    })
  }
}

export default createNodeView(SupplementsView)
