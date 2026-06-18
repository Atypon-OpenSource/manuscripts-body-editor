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

import { BoxElementNode } from '@manuscripts/transform'

import BlockView from './block_view'
import { createNodeView } from './creators'
import {
  createPositionMenuWrapper,
  getHorizontalPositionOptions,
  HorizontalPositions,
} from '../lib/position-menu'
import ReactSubView from './ReactSubView'
import { ContextMenu } from '@manuscripts/style-guide'

export class BoxElementView extends BlockView<BoxElementNode> {
  public elementType = 'div'
  private positionMenuWrapper: HTMLDivElement

  public createElement = () => {
    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.className = 'block box-element'
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.dom.appendChild(this.contentDOM)
  }

  public updateContents() {
    super.updateContents()
    this.addTools()
  }

  protected addTools() {
    this.addPositionMenu()
  }

  private posMenuSelector = 'position-menu'

  protected addPositionMenu() {
    if (this.props.getCapabilities()?.editArticle) {
      // Remove existing position menu if it exists
      const existingMenu = this.dom.querySelector('.' + this.posMenuSelector)
      if (existingMenu) {
        existingMenu.remove()
      }

      this.positionMenuWrapper = createPositionMenuWrapper(
        this.node.attrs.type || HorizontalPositions.default,
        this.showPositionMenu,
        this.props
      )
      this.dom.prepend(this.positionMenuWrapper)
    }
  }

  private updateHorizontalPosition(horizontalPosition: string) {
    const tr = this.view.state.tr
    tr.setNodeAttribute(this.getPos(), 'type', horizontalPosition)
    this.view.dispatch(tr)
  }

  private showPositionMenu = () => {
    this.props.popper.destroy()
    const componentProps = getHorizontalPositionOptions(
      this.node.attrs.type,
      this.updateHorizontalPosition.bind(this),
      this.props.popper.destroy
    )
    this.props.popper.show(
      this.positionMenuWrapper,
      ReactSubView(
        this.props,
        ContextMenu,
        componentProps,
        this.node,
        this.getPos,
        this.view,
        ['context-menu', this.posMenuSelector]
      ),
      'left',
      false
    )
  }
}

export default createNodeView(BoxElementView)
