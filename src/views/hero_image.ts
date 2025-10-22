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

import { FigureElementNode } from '@manuscripts/transform'

import { arrowUp } from '../icons'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class HeroImageView extends BlockView<Trackable<FigureElementNode>> {
  private container: HTMLElement
  private collapsed = false

  public ignoreMutation = () => true

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block', 'hero-image-container')
    this.dom.appendChild(this.container)
    this.dom.setAttribute('contentEditable', 'false')
    this.container.appendChild(this.createPanel())

    this.contentDOM = document.createElement('figure')
    this.contentDOM.classList.add('figure-block', 'hero-image-figure')
    this.contentDOM.setAttribute('id', this.node.attrs.id)

    this.container.appendChild(this.contentDOM)
  }

  createPanel() {
    const panel = document.createElement('div')
    panel.classList.add('panel-header')

    const label = document.createElement('span')
    label.textContent = 'Hero image'

    const heroImageToggleBtn = document.createElement('button')
    heroImageToggleBtn.classList.add('toggle-btn', 'button-reset')

    heroImageToggleBtn.innerHTML = arrowUp
    heroImageToggleBtn.classList.toggle('collapsed', this.collapsed)

    heroImageToggleBtn.onclick = () => {
      this.collapsed = !this.collapsed
      if (this.contentDOM) {
        this.contentDOM.style.display = this.collapsed ? 'none' : ''
      }
      heroImageToggleBtn.classList.toggle('collapsed', this.collapsed)
    }

    panel.appendChild(label)
    panel.appendChild(heroImageToggleBtn)
    return panel
  }
}

export default createNodeView(HeroImageView)
