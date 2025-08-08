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

import { ContextMenu } from '@manuscripts/style-guide'
import { FigureElementNode, FigureNode, schema } from '@manuscripts/transform'

import { createPositionMenuWrapper } from '../lib/position-menu'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

export enum figurePositions {
  left = 'half-left',
  right = 'half-right',
  default = '',
}

export class ImageElementView extends BlockView<Trackable<FigureElementNode>> {
  public container: HTMLElement
  private positionMenuWrapper: HTMLDivElement
  private figurePosition: string

  public ignoreMutation = () => true

  public createDOM() {
    super.createDOM()
    this.dom.setAttribute('contenteditable', 'false')
  }

  public createElement() {
    this.container = document.createElement('div')
    this.container.classList.add('block')
    this.container.setAttribute('contenteditable', 'true')
    this.dom.appendChild(this.container)

    // figure group
    this.contentDOM = document.createElement('figure')
    this.contentDOM.classList.add('figure-block')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.container.appendChild(this.contentDOM)

    this.addTools()
  }

  public updateContents() {
    super.updateContents()
    this.addTools()
  }

  protected addTools() {
    this.addPositionMenu()
  }

  protected addPositionMenu() {
    if (this.props.getCapabilities()?.editArticle) {
      // Remove existing position menu if it exists
      const existingMenu = this.container.querySelector('.position-menu')
      if (existingMenu) {
        existingMenu.remove()
      }

      const firstFigure = this.getFirstFigure()
      this.figurePosition = firstFigure?.attrs.type || figurePositions.default

      this.positionMenuWrapper = createPositionMenuWrapper(
        this.figurePosition,
        this.showPositionMenu,
        this.props
      )

      this.container.prepend(this.positionMenuWrapper)
    }
  }

  /**
   * Gets the first figure node from the element.
   * Optimized for image_element (direct access) vs figure_element (loop through all).
   * @returns The first figure node or null if no figure exists
   */
  private getFirstFigure(): FigureNode | null {
    // Optimize for image_element which only has one figure
    if (this.node.type === schema.nodes.image_element) {
      // Direct access to the single figure in image_element
      const figureNode = this.node.firstChild
      if (figureNode && figureNode.type === schema.nodes.figure) {
        return figureNode as FigureNode
      }
      return null
    } else {
      // For figure_element, find the first figure
      let firstFigure: FigureNode | null = null
      this.node.forEach((node) => {
        if (node.type === schema.nodes.figure && !firstFigure) {
          firstFigure = node as FigureNode
        }
      })
      return firstFigure
    }
  }

  /**
   * Gets all figure nodes and their positions from the element.
   * Optimized for image_element (direct access) vs figure_element (loop through all).
   * @returns Array of figure nodes with their positions
   */
  private getAllFigures() {
    const figures: Array<{ node: FigureNode; pos: number }> = []
    let pos = this.getPos() + 1

    if (this.node.type === schema.nodes.image_element) {
      const figureNode = this.node.firstChild
      if (figureNode && figureNode.type === schema.nodes.figure) {
        figures.push({ node: figureNode as FigureNode, pos })
      }
    } else {
      this.node.forEach((node) => {
        if (node.type === schema.nodes.figure) {
          figures.push({ node: node as FigureNode, pos })
        }
        pos += node.nodeSize
      })
    }

    return figures
  }

  private showPositionMenu = () => {
    const firstFigure = this.getFirstFigure()
    if (!firstFigure) {
      return
    }

    this.props.popper.destroy()

    const options = [
      {
        label: 'Left',
        action: () => {
          this.props.popper.destroy()
          this.updateAllFiguresPosition(figurePositions.left)
        },
        icon: 'ImageLeft',
        selected: this.figurePosition === figurePositions.left,
      },
      {
        label: 'Default',
        action: () => {
          this.props.popper.destroy()
          this.updateAllFiguresPosition(figurePositions.default)
        },
        icon: 'ImageDefault',
        selected: !this.figurePosition,
      },
      {
        label: 'Right',
        action: () => {
          this.props.popper.destroy()
          this.updateAllFiguresPosition(figurePositions.right)
        },
        icon: 'ImageRight',
        selected: this.figurePosition === figurePositions.right,
      },
    ]

    const componentProps = {
      actions: options,
    }

    this.props.popper.show(
      this.positionMenuWrapper,
      ReactSubView(
        this.props,
        ContextMenu,
        componentProps,
        this.node,
        this.getPos,
        this.view,
        ['context-menu', 'position-menu']
      ),
      'left',
      false
    )
  }

  /**
   * Updates the position type for all figures within this element.
   * This affects all figures in figure_element, or the single figure in image_element.
   * @param position - The new position type ('half-left', 'half-right', or '')
   */
  private updateAllFiguresPosition(position: string) {
    const figures = this.getAllFigures()
    const { tr } = this.view.state

    figures.forEach(({ node, pos }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        type: position,
      })
    })

    this.view.dispatch(tr)
    this.figurePosition = position
  }
}

export default createNodeView(ImageElementView)
