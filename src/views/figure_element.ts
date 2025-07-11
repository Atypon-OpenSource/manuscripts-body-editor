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

export class FigureElementView extends ImageElementView {
  public ignoreMutation = () => true
  private addFigureBtn: HTMLButtonElement | null = null
  private pendingUpdate: number | null = null

  public createElement() {
    console.log('[Figure] Creating element')
    super.createElement()
    this.createAddButton()
    this.schedulePositionUpdate()
  }

  private createAddButton() {
    if (!this.props.getCapabilities()?.editArticle) {
      console.log('[Figure] Edit capabilities not available, skipping button')
      return
    }

    console.log('[Figure] Creating add button')
    this.addFigureBtn = document.createElement('button')
    this.addFigureBtn.className = 'add-figure-button'
    this.addFigureBtn.innerHTML = addFigureBtnIcon
    this.addFigureBtn.title = 'Add figure'
    this.addFigureBtn.addEventListener('click', this.addFigure)
    this.container.prepend(this.addFigureBtn)
  }

  private schedulePositionUpdate() {
    if (this.pendingUpdate) {
      console.log('[Figure] Cancelling pending update')
      cancelAnimationFrame(this.pendingUpdate)
    }

    console.log('[Figure] Scheduling position update')
    this.pendingUpdate = requestAnimationFrame(() => {
      this.positionButton()
      this.pendingUpdate = null
    })
  }

  private positionButton() {
    if (!this.addFigureBtn) {
      console.warn('[Figure] No button to position')
      return
    }

    console.log('[Figure] Positioning button')
    const figures = this.container.querySelectorAll('figure')

    if (figures.length === 0) {
      console.warn('[Figure] No figures found')
      return
    }

    const lastFigure = figures[figures.length - 1]
    const figureRect = lastFigure.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()
    const top = figureRect.bottom - containerRect.top + 10

    console.log('[Figure] Position values:', {
      figureBottom: figureRect.bottom,
      containerTop: containerRect.top,
      calculatedTop: top,
    })

    this.addFigureBtn.style.top = `${top}px`
    console.log('[Figure] Button positioned at', top, 'px')
  }

  public updateContents() {
    console.log('[Figure] Updating contents')
    super.updateContents()
    this.schedulePositionUpdate()
  }

  public destroy() {
    console.log('[Figure] Destroying')
    if (this.pendingUpdate) {
      cancelAnimationFrame(this.pendingUpdate)
    }
    super.destroy()
  }

  private addFigure = () => {
    console.log('[Figure] Add figure triggered')
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
    console.log('[Figure] Inserting new figure at position', finalInsertPos)

    const figureNode = state.schema.nodes.figure.create()
    tr.insert(finalInsertPos, figureNode)
    this.view.dispatch(tr)
  }
}

export default createNodeView(FigureElementView)
