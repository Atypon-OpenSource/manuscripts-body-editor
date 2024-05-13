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
  protected activePopper?: Popper

  public show(
    target: Element,
    contents: HTMLElement,
    placement: Popper.Placement = 'bottom',
    showArrow = true,
    modifiers: Popper.Modifiers = {}
  ) {
    if (this.activePopper) {
      return this.destroy()
    }

    window.requestAnimationFrame(() => {
      const container = document.createElement('div')
      container.className = 'popper'

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

      container.appendChild(contents)
      document.body.appendChild(container)

      this.activePopper = new Popper(target, container, {
        placement,
        removeOnDestroy: true,
        modifiers,
        onCreate: (data) => {
          this.fixPopperPosition(data, container)
          this.addContainerClass(target)
          this.focusInput(container)
        },
        onUpdate: (data) => {
          this.fixPopperPosition(data, container)
        },
      })
    })
  }

  public destroy() {
    if (this.activePopper) {
      this.removeContainerClass(this.activePopper.reference as Element)
      this.activePopper.destroy()
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
  // func to detreimne if the popper will overflow the body boundary
  private fixPopperPosition(data: Popper.Data, popperElement: HTMLDivElement) {
    const toolsPanel = popperElement.querySelector(
      '.tools-panel'
    ) as HTMLElement
    const totalWidth = data.offsets.popper.left + toolsPanel.clientWidth
    const arrow = popperElement.querySelector('.popper-arrow') as HTMLElement
    // the following will always change the placement to bottom,
    // for better positioning of the arrow and the popper
    if (data.originalPlacement != 'bottom') {
      data.instance.options.placement = 'bottom'
      data.instance.update()
    }
    if (totalWidth > window.innerWidth) {
      // the 40 is the size of the resizer button
      popperElement.style.left =
        (window.innerWidth - totalWidth - 40).toString() + 'px'
      if (arrow) {
        // the 30 is the size of the resizer button - the arrow margin value
        arrow.style.left =
          Math.abs(window.innerWidth - totalWidth - 30).toString() + 'px'
      }
    }
  }

  private removeContainerClass(referenceElement: Element) {
    const container = referenceElement.closest('.ProseMirror')

    if (container) {
      container.classList.remove('popper-open')
    }
  }
}
