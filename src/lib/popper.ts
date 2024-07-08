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
  createPopper,
  Instance,
  Placement,
  StrictModifiers,
} from '@popperjs/core'

export class PopperManager {
  private activePopper?: Instance
  private handleDocumentClick?: (e: Event) => void

  public show(
    target: Element,
    contents: HTMLElement,
    placement: Placement = 'bottom',
    showArrow = true,
    modifiers: Array<Partial<StrictModifiers>> = []
  ) {
    // destroy any existing popper first
    // checking activePopper is in destroy() method
    this.destroy()

    window.requestAnimationFrame(() => {
      const container = document.createElement('div')
      container.className = 'popper'

      container.addEventListener('click', (e) => {
        e.stopPropagation()
      })

      if (showArrow) {
        const arrow = document.createElement('div')
        arrow.className = 'popper-arrow'
        container.appendChild(arrow)
        modifiers.push({
          name: 'arrow',
          options: {
            element: arrow,
          },
        })
      } else {
        modifiers.push({
          name: 'arrow',
          options: {
            element: null,
          },
        })
      }

      container.appendChild(contents)
      document.body.appendChild(container)

      this.activePopper = createPopper(target, container, {
        placement,
        modifiers,
        onFirstUpdate: () => {
          this.addContainerClass(target)
          this.focusInput(container)
        },
      })

      this.handleDocumentClick = (e) => {
        const node = e.target as Node
        if (!container.contains(node) && !target.contains(node)) {
          this.destroy()
        }
      }
      // add EventListener for checking if click was done outside of editor
      // only if popper has class 'context-menu'
      if (contents.classList.contains('context-menu')) {
        window.addEventListener('click', this.handleDocumentClick)
      }
    })
  }

  public destroy() {
    if (this.activePopper) {
      console.log(
        'destroying popper',
        this.activePopper,
        this.activePopper.state.elements.reference
      )
      this.removeContainerClass(
        this.activePopper.state.elements.reference as Element
      )
      this.activePopper.destroy()
      this.activePopper.state.elements.popper.remove()
      if (this.handleDocumentClick) {
        window.removeEventListener('click', this.handleDocumentClick)
      }

      delete this.activePopper
    }
  }

  public update() {
    if (this.activePopper) {
      this.activePopper.update()
    }
  }

  private focusInput(container: HTMLDivElement) {
    const element = container.querySelector('input') as HTMLDivElement | null

    if (element) {
      element.focus()
    }
  }

  private addContainerClass(referenceElement: Element) {
    const container = referenceElement.closest('.ProseMirror')

    if (container) {
      container.classList.add('popper-open')
    }
  }

  private removeContainerClass(referenceElement: Element) {
    const container = referenceElement.closest('.ProseMirror')

    if (container) {
      container.classList.remove('popper-open')
    }
  }
}
