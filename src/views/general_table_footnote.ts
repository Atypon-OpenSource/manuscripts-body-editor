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
import { GeneralTableFootnoteNode, schema } from '@manuscripts/transform'
import {
  findChildrenByType,
  findParentNodeOfTypeClosestToPos,
} from 'prosemirror-utils'

import {
  DeleteFootnoteDialog,
  DeleteFootnoteDialogProps,
} from '../components/views/DeleteFootnoteDialog'
import { isDeleted } from '../lib/track-changes-utils'
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

export class GeneralTableFootnoteView extends BaseNodeView<
  Trackable<GeneralTableFootnoteNode>
> {
  dialog: HTMLElement
  contextMenu: HTMLDivElement

  public initialise = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('footnote', 'general-table-footnote')
    this.dom.addEventListener('mousedown', this.handleClick)
    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('footnote-text')
    this.updateContents()
  }

  public updateContents() {
    super.updateContents()
    this.dom.innerHTML = ''
    this.contentDOM && this.dom.appendChild(this.contentDOM)
  }

  handleClick = (e: Event) => {
    const element = e.target as HTMLElement
    const can = this.props.getCapabilities()

    if (can.editArticle) {
      const item = element.closest('.general-table-footnote')
      if (item) {
        this.showContextMenu(item as HTMLElement)
      }
    }
  }

  showContextMenu(element: HTMLElement) {
    this.props.popper.destroy()

    const componentProps: ContextMenuProps = {
      actions: [],
    }
    componentProps.actions.push({
      label: 'Delete',
      action: () => this.handleDeleteClick(),
      icon: 'Delete',
    })

    this.contextMenu = ReactSubView(
      this.props,
      ContextMenu,
      componentProps,
      this.node,
      this.getPos,
      this.view,
      ['context-menu', 'footnote-context-menu']
    )
    this.props.popper.show(element, this.contextMenu, 'right-start')
  }

  handleDeleteClick = () => {
    const componentProps: DeleteFootnoteDialogProps = {
      header: 'Delete table general note',
      message: 'This action will entirely remove the table general note.',
      handleDelete: this.handleDelete,
    }

    this.dialog = ReactSubView(
      this.props,
      DeleteFootnoteDialog,
      componentProps,
      this.node,
      this.getPos,
      this.view
    )

    this.props.popper.show(this.dom, this.dialog, 'auto', false)
  }

  handleDelete = () => {
    const tr = this.view.state.tr

    const pos = this.getPos()
    const $pos = this.view.state.doc.resolve(pos)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const footer = findParentNodeOfTypeClosestToPos(
      $pos,
      schema.nodes.table_element_footer
    )!
    const element = findChildrenByType(
      footer.node,
      schema.nodes.footnotes_element
    )[0]
    if (element && !isDeleted(element.node)) {
      const from = pos
      const to = from + this.node.nodeSize
      tr.delete(from, to)
    } else {
      const from = footer.pos
      const to = from + footer.node.nodeSize
      tr.delete(from, to)
    }
    this.view.dispatch(tr)
  }
}

export default createNodeView(GeneralTableFootnoteView)
