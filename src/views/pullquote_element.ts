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

import { ContextMenu, ContextMenuProps } from '@manuscripts/style-guide'
import { PullquoteElementNode, schema } from '@manuscripts/transform'
import { findChildrenByType } from 'prosemirror-utils'

import BlockView from './block_view'
import { createNodeOrElementView } from './creators'
import ReactSubView from './ReactSubView'

export class PullquoteElementView extends BlockView<PullquoteElementNode> {
  public elementType = 'aside'
  contextMenu: HTMLElement

  public ignoreMutation = () => true
  public stopEvent = () => true

  public createElement = () => {
    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.className = 'block'
    this.contentDOM.classList.add('pullquote')

    this.dom.appendChild(this.contentDOM)
  }

  handleAddFigure() {
    const tr = this.view.state.tr
    tr.insert(this.getPos() + 1, schema.nodes.quote_image.create())
    this.view.dispatch(tr)
  }

  public actionGutterButtons = (): HTMLElement[] => {
    const contextMenu = this.addFigureContextMenu()
    return contextMenu ? [contextMenu] : []
  }

  addFigureContextMenu = (): HTMLElement | undefined => {
    const can = this.props.getCapabilities()
    const componentProps: ContextMenuProps = {
      actions: [],
    }
    if (can.editArticle) {
      componentProps.actions.push({
        label: 'Add Image',
        action: () => this.handleAddFigure(),
        icon: 'AddFigure',
        disabled: !!findChildrenByType(this.node, schema.nodes.quote_image)
          .length,
      })

      this.contextMenu = ReactSubView(
        this.props,
        ContextMenu,
        componentProps,
        this.node,
        this.getPos,
        this.view,
        ['context-menu']
      )
      return this.contextMenu
    }
    return undefined
  }
}

export default createNodeOrElementView(PullquoteElementView, 'aside')
