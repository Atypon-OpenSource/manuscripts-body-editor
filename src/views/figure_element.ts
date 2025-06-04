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

import { PlusIcon } from '@manuscripts/style-guide'
import { FigureElementNode, schema } from '@manuscripts/transform'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class FigureElementView extends BlockView<Trackable<FigureElementNode>> {
  private container: HTMLElement
  private addFigureBtn: HTMLButtonElement

  public ignoreMutation = () => true

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block')
    this.dom.appendChild(this.container)

    // figure group
    this.contentDOM = document.createElement('figure')
    this.contentDOM.classList.add('figure-block')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.container.appendChild(this.contentDOM)

    // Display the button only when it's a figure panel, not a simple image

    if (this.node.type === schema.nodes.figure_element) {
      this.addFigureElementButtons()
    }
  }

  private addFigureElementButtons() {
    if (this.props.getCapabilities()?.editArticle) {
      this.addFigureBtn = document.createElement('button')
      this.addFigureBtn.className = 'add-figure-button'
      this.addFigureBtn.innerHTML = renderToStaticMarkup(
        createElement(PlusIcon)
      )
      this.addFigureBtn.title = 'Add figure'
      this.addFigureBtn.addEventListener('click', this.addFigure)
      this.container.prepend(this.addFigureBtn)
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

    // Create new figure node
    const figureNode = state.schema.nodes.figure.create()

    tr.insert(finalInsertPos, figureNode)
    this.view.dispatch(tr)
  }
}

export default createNodeView(FigureElementView)
