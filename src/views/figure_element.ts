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

  public createElement = () => {
    super.createElement()
    this.addFigureElementButtons()
  }

  private addFigureElementButtons() {
    if (this.props.getCapabilities()?.editArticle) {
      const addFigureBtn = Object.assign(document.createElement('button'), {
        className: 'add-figure-button',
        innerHTML: addFigureBtnIcon,
        title: 'Add figure',
      })
      addFigureBtn.addEventListener('click', () => this.addFigure())
      this.container.prepend(addFigureBtn)
    }
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
