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

import {
  arrowUp,
  leadingHalfLeftIcon,
  leadingHeroImageIcon,
  leadingLargeFloatIcon,
  leadingSmallFloatIcon,
  leadingWallpaperIcon,
} from '../icons'
import { handleEnterKey } from '../lib/navigation-utils'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'

const LAYOUT_OPTIONS_CONFIG = [
  {
    label: 'Hero Image',
    icon: leadingHeroImageIcon,
    attr: 'leading',
  },
  {
    label: 'Float Image - Small',
    icon: leadingSmallFloatIcon,
    attr: 'leading-small-float',
  },
  {
    label: 'Float Image - Large',
    icon: leadingLargeFloatIcon,
    attr: 'leading-large-float',
  },
  {
    label: 'Wallpaper Image',
    icon: leadingWallpaperIcon,
    attr: 'leading-wallpaper',
  },
  {
    label: 'Half Image',
    icon: leadingHalfLeftIcon,
    attr: 'leading-half-left',
  },
]

export class HeroImageView extends BlockView<Trackable<FigureElementNode>> {
  private container: HTMLElement
  private layoutOptions: HTMLElement
  private abortController: AbortController
  private collapsed = false
  private layoutPanelCollapsed = false

  public ignoreMutation = () => true

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block', 'hero-image-container')
    this.dom.appendChild(this.container)

    this.abortController = new AbortController()

    this.container.appendChild(this.createPanel())
    this.container.appendChild(this.createLayoutPanel())

    this.layoutOptions = this.creatLayoutOptions()
    this.layoutOptions.addEventListener('change', this.onSelectOption, {
      signal: this.abortController.signal,
    })

    this.container.appendChild(this.layoutOptions)

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
    label.contentEditable = 'false'

    const heroImageToggleBtn = document.createElement('button')
    heroImageToggleBtn.classList.add('toggle-btn', 'button-reset')

    heroImageToggleBtn.innerHTML = arrowUp
    heroImageToggleBtn.classList.toggle('collapsed', this.collapsed)

    const handleToggle = () => {
      this.collapsed = !this.collapsed
      if (this.contentDOM) {
        this.contentDOM.style.display = this.collapsed ? 'none' : ''
      }
      heroImageToggleBtn.classList.toggle('collapsed', this.collapsed)
    }

    heroImageToggleBtn.onclick = handleToggle
    heroImageToggleBtn.addEventListener(
      'keydown',
      handleEnterKey(handleToggle),
      {
        signal: this.abortController.signal,
      }
    )

    panel.appendChild(label)
    panel.appendChild(heroImageToggleBtn)
    return panel
  }

  createLayoutPanel() {
    const panel = document.createElement('div')
    panel.classList.add('panel-header', 'layout-header')

    const label = document.createElement('span')
    label.textContent = 'Layout'
    label.contentEditable = 'false'

    const toggleBtn = document.createElement('button')
    toggleBtn.classList.add('toggle-btn', 'button-reset')

    toggleBtn.innerHTML = arrowUp
    toggleBtn.classList.toggle('collapsed', this.layoutPanelCollapsed)

    const handleToggle = () => {
      this.layoutPanelCollapsed = !this.layoutPanelCollapsed
      if (this.layoutOptions) {
        this.layoutOptions.style.display = this.layoutPanelCollapsed
          ? 'none'
          : ''
      }
      toggleBtn.classList.toggle('collapsed', this.layoutPanelCollapsed)
    }

    toggleBtn.onclick = handleToggle
    toggleBtn.addEventListener('keydown', handleEnterKey(handleToggle), {
      signal: this.abortController.signal,
    })

    panel.appendChild(label)
    panel.appendChild(toggleBtn)
    return panel
  }

  creatLayoutOptions() {
    const optionsGroup = document.createElement('div')
    optionsGroup.className = 'layout-options-group'

    LAYOUT_OPTIONS_CONFIG.map(({ label, icon, attr }) => {
      const image = document.createElement('div')
      image.className = 'layout-option-image'
      image.innerHTML = icon

      const input = document.createElement('input')
      input.type = 'radio'
      input.name = 'layout-option'
      input.value = attr
      input.checked = attr === this.node.attrs.type

      const inputLabel = document.createElement('span')
      inputLabel.className = 'layout-option-label'
      inputLabel.innerText = label

      const wrapper = document.createElement('div')
      wrapper.className = 'layout-option-label-wrapper'
      wrapper.append(input, inputLabel)

      const container = document.createElement('label')
      container.className = 'layout-option'
      container.append(image, wrapper)
      optionsGroup.appendChild(container)
    })
    optionsGroup.contentEditable = 'false'
    return optionsGroup
  }

  private onSelectOption = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target && target.type === 'radio' && target.name === 'layout-option') {
      const { state, dispatch } = this.view
      const tr = state.tr.setNodeMarkup(this.getPos(), undefined, {
        ...this.node.attrs,
        type: target.value,
      })
      dispatch(tr)
    }
  }

  destroy() {
    this.abortController?.abort()
    super.destroy()
  }
}

export default createNodeView(HeroImageView)
