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
import { Node } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'

import { addAuthorIcon } from '../icons'
import { handleEnterKey } from '../lib/navigation-utils'
import { createNodeView } from './creators'
import { FigureEditableView } from './figure_editable'
import { ImageElementView } from './image_element'

export class FigureElementView extends ImageElementView {
  public ignoreMutation = () => true
  private addFigureBtn: HTMLButtonElement
  private resizeObserver: ResizeObserver | null = null

  public createElement = () => {
    super.createElement()
    this.addFigureElementButtons()
  }

  public initialise() {
    super.initialise()
    this.setupResizeObserver()
  }

  private setupResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }

    this.resizeObserver = new ResizeObserver(() => {
      // Reposition button when figure dimensions change
      requestAnimationFrame(() => this.updateButtonPosition())
    })

    // Observe all current figures
    this.container.querySelectorAll('figure').forEach((figure) => {
      this.resizeObserver?.observe(figure)
    })
  }

  private addFigureElementButtons() {
    if (this.props.getCapabilities()?.editArticle) {
      this.addFigureBtn = Object.assign(document.createElement('button'), {
        className: 'add-button',
        innerHTML: addAuthorIcon,
        title: 'Add figure',
      })
      this.addFigureBtn.addEventListener('click', () => this.addFigure())
      this.addFigureBtn.addEventListener(
        'keydown',
        handleEnterKey(() => this.addFigure())
      )
      this.addFigureBtn.tabIndex = 0
      this.container.prepend(this.addFigureBtn)
    }
  }

  private updateButtonPosition() {
    if (!this.addFigureBtn) {
      return
    }

    const figures = this.container.querySelectorAll('figure')
    const lastFigure = figures[figures.length - 1] as HTMLElement

    if (!lastFigure) {
      return // No figures found
    }

    const lastFigureRect = lastFigure.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()

    // Calculate position relative to container
    const relativeTop = lastFigureRect.bottom - containerRect.top + 20
    this.addFigureBtn.style.top = `${relativeTop}px`
  }

  private updateAddButtonState() {
    if (!this.addFigureBtn) {
      return
    }

    // Check if there's already an empty figure placeholder
    let hasEmptyFigure = false
    this.node.forEach((node) => {
      if (node.type === schema.nodes.figure) {
        // Check if this figure is empty (no src or empty src)
        const src = node.attrs.src || ''
        if (src.trim().length === 0) {
          hasEmptyFigure = true
        }
      }
    })

    // Disable button if there's already an empty figure
    if (hasEmptyFigure) {
      this.addFigureBtn.classList.add('disabled')
      this.addFigureBtn.disabled = true
    } else {
      this.addFigureBtn.classList.remove('disabled')
      this.addFigureBtn.disabled = false
    }
  }

  /**
   * Updates button position and re-observes figures.
   */
  public update(node: Node): boolean {
    const handledBySuper = super.update(node)

    if (handledBySuper) {
      this.setupResizeObserver() // Re-observe figures after node update
      requestAnimationFrame(() => {
        this.updateButtonPosition() // Reposition after DOM update
        this.updateAddButtonState() // Update button state after DOM update
        this.updateChildDragHandlers()
      })
    }

    return handledBySuper
  }

  private updateChildDragHandlers() {
    const dragHandlers = this.container.querySelectorAll('.drag-handler')
    dragHandlers.forEach((handler) => handler.remove())

    const figureElements = this.container.querySelectorAll('figure')
    figureElements.forEach((figureElement) => {
      const figureView = (
        figureElement as HTMLElement & { __figureView?: FigureEditableView }
      ).__figureView
      figureView?.addTools()
    })
  }

  public updateContents() {
    super.updateContents()
    requestAnimationFrame(() => {
      this.updateButtonPosition()
      this.updateAddButtonState()
    })
  }

  private addFigure = () => {
    const { state } = this.view
    const { tr } = state
    const figureElementPos = this.getPos()

    let insertPos = figureElementPos + 1
    let lastFigureEndPos = insertPos
    let hasFigures = false

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
    tr.setSelection(TextSelection.create(tr.doc, finalInsertPos + 1))
    this.view.dispatch(tr.scrollIntoView())
  }

  public destroy() {
    // Disconnect ResizeObserver on destroy
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    super.destroy()
  }
}

export default createNodeView(FigureElementView)
