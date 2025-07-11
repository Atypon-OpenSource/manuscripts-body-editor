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
  private addFigureBtn: HTMLButtonElement

  public createElement = () => {
    super.createElement()
    this.addFigureElementButtons()
    // Use setTimeout for initial positioning as well
    setTimeout(() => this.updateButtonPosition(), 0)
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
    if (!this.addFigureBtn) {
      return
    }

    // Find the last figure in the figure element node
    const figures = this.container.querySelectorAll('figure')
    const lastFigure = figures[figures.length - 1] as HTMLElement

    if (!lastFigure) {
      return
    }

    // Use getBoundingClientRect for more reliable measurements
    const lastFigureRect = lastFigure.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()

    // Calculate position relative to the container
    const relativeTop = lastFigureRect.bottom - containerRect.top + 20
    this.addFigureBtn.style.top = `${relativeTop}px`
  }

  public updateContents() {
    super.updateContents()
    // Use setTimeout to ensure DOM is updated before calculating position
    setTimeout(() => this.updateButtonPosition(), 1000)
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
