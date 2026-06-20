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
import { HorizontalPositionMenu } from '../lib/position-menu'

export class BoxElementView extends BlockView<BoxElementNode> {
  public elementType = 'div'
  container: HTMLDivElement

  public createElement = () => {
    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.className = 'block box-element'
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.container = document.createElement('div')
    this.container.classList.add('container')
    this.container.appendChild(this.contentDOM)
    this.dom.appendChild(this.container)
  }

  public updateContents() {
    super.updateContents()
    console.log('BOX UPDATE CONTENT CALLED')
    this.addTools()
  }

  protected addTools() {
    this.addPositionMenu()
  }

  private positionMenu: HorizontalPositionMenu

  protected addPositionMenu() {
    if (!this.positionMenu) {
      this.positionMenu = new HorizontalPositionMenu(
        this,
        this.updateHorizontalPosition,
        this.container
      )
    }
    this.positionMenu.create(true)
  }

  private updateHorizontalPosition(horizontalPosition: string) {
    const tr = this.view.state.tr
    tr.setNodeAttribute(this.getPos(), 'type', horizontalPosition)
    this.view.dispatch(tr)
  }
}

export default createNodeView(BoxElementView)
