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
import { NodeSelection } from 'prosemirror-state'
import { findChildrenByType } from 'prosemirror-utils'

import { CommentKey } from '../lib/comments'
import { setCommentSelection } from '../plugins/comments'
import BlockView from './block_view'
import { createNodeOrElementView } from './creators'
import ReactSubView from './ReactSubView'

export class PullquoteElementView extends BlockView<PullquoteElementNode> {
  public elementType = 'aside'
  contextMenu: HTMLElement

  public ignoreMutation = () => true
  public stopEvent = () => true

  private handleClick = (event: Event) => {
    const element = event.target as HTMLElement
    // Handle click on comment marker
    const marker = element.closest('.comment-marker') as HTMLElement
    if (marker) {
      const key = marker.dataset.key as CommentKey
      const tr = this.view.state.tr
      setCommentSelection(tr, key, undefined, false)
      tr.setSelection(NodeSelection.create(this.view.state.doc, this.getPos()))
      this.view.dispatch(tr)
      return
    }
  }

  public createElement = () => {
    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.className = 'block'
    this.contentDOM.classList.add('pullquote')

    this.dom.appendChild(this.contentDOM)

    // Add click event listener to handle comment marker clicks
    this.dom.addEventListener('click', this.handleClick)
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

  public destroy = () => {
    // Clean up event listener
    this.dom.removeEventListener('click', this.handleClick)
    super.destroy()
  }
}

export default createNodeOrElementView(PullquoteElementView, 'aside')
