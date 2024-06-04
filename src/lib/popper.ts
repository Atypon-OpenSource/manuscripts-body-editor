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

import Popper from 'popper.js'

export class PopperManager {
  private activePopper?: Popper
  private handleDocumentClick?: (e: Event) => void

  public show(
    target: Element,
    contents: HTMLElement,
    placement: Popper.Placement = 'bottom',
    showArrow = true,
    modifiers: Popper.Modifiers = {}
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

        modifiers.arrow = {
          element: arrow,
        }
      } else {
        modifiers.arrow = {
          enabled: false,
        }
      }
      modifiers.preventOverflow = {
        escapeWithReference: true,
      }

      container.appendChild(contents)
      document.body.appendChild(container)

      this.activePopper = new Popper(target, container, {
        placement,
        removeOnDestroy: true,
        modifiers,
        onCreate: () => {
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
      this.removeContainerClass(this.activePopper.reference as Element)
      this.activePopper.destroy()
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
