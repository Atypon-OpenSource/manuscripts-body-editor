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

import { schema } from '@manuscripts/transform'

import { addFigureBtnIcon } from '../icons'
import { createNodeView } from './creators'
import { ImageElementView } from './image_element'

// Constants for button positioning
const buttonPositionConfig = {
  // Minimum spacing above accessibility elements when expanded (in pixels)
  accessibilityElementsSpacing: 60,
  // Fixed bottom position when accessibility elements are collapsed (in pixels)
  collapsedBottomPosition: 45,
} as const

export class FigureElementView extends ImageElementView {
  public ignoreMutation = () => true
  private addFigureBtn: HTMLButtonElement

  public createElement = () => {
    super.createElement()
    this.addFigureElementButtons()
    this.updateButtonPosition()
  }

  private addFigureElementButtons() {
    if (this.props.getCapabilities()?.editArticle) {
      this.addFigureBtn = Object.assign(document.createElement('button'), {
        className: 'add-figure-button',
        innerHTML: addFigureBtnIcon,
        title: 'Add figure',
      })
      this.addFigureBtn.addEventListener('click', () => this.addFigure())
      this.container.prepend(this.addFigureBtn)
    }
  }

  private updateButtonPosition() {
    let bottomPosition: number

    if (!this.addFigureBtn) {
      return
    }

    // Check if accessibility elements are expanded
    const isAccessibilityExpanded =
      this.container.closest('.show_accessibility_element') !== null

    if (isAccessibilityExpanded) {
      const accessibilityElements = this.container.querySelectorAll(
        '.accessibility_element'
      )
      let accessibilityHeight = 0

      accessibilityElements.forEach((element) => {
        if (element instanceof HTMLElement) {
          accessibilityHeight += element.offsetHeight
        }
      })

      // Position button above accessibility elements with minimum spacing
      bottomPosition =
        accessibilityHeight + buttonPositionConfig.accessibilityElementsSpacing
    } else {
      // When accessibility elements are collapsed, use fixed position
      bottomPosition = buttonPositionConfig.collapsedBottomPosition
    }

    this.addFigureBtn.style.bottom = `${bottomPosition}px`
  }

  public updateContents() {
    super.updateContents()
    // Use setTimeout to ensure DOM is updated before calculating position
    setTimeout(() => this.updateButtonPosition(), 0)
  }

  private addFigure = () => {
    const { state } = this.view
    const { tr } = state
    const figureElementPos = this.getPos()

    // Find the position after the last figure node
    let insertPos = figureElementPos + 1
    let lastFigureEndPos = insertPos
    let hasFigures = false

    // Iterate through all child nodes
    this.node.forEach((node) => {
      if (node.type === schema.nodes.figure) {
        lastFigureEndPos = insertPos + node.nodeSize
        hasFigures = true
      }
      insertPos += node.nodeSize
    })

    const finalInsertPos = hasFigures ? lastFigureEndPos : figureElementPos + 1

    const figureNode = state.schema.nodes.figure.create()

    tr.insert(finalInsertPos, figureNode)
    this.view.dispatch(tr)
  }
}

export default createNodeView(FigureElementView)
