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
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'
import { isDeleted, isPendingInsert } from '@manuscripts/track-changes-plugin'
import { handleEnterKey } from '../lib/navigation-utils'
import { isSelectionInsideNode } from '../lib/view'

export class GeneralTableFootnoteView extends BaseNodeView<
  Trackable<GeneralTableFootnoteNode>
> {
  dialog: HTMLElement
  contextMenu: HTMLDivElement
  isMenuShown: boolean

  public initialise = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('footnote', 'general-table-footnote')
    this.dom.tabIndex = 0
    this.dom.addEventListener(
      'keydown',
      handleEnterKey(() => {
        const can = this.props.getCapabilities()
        const canShowMenu = can.editArticle && !isDeleted(this.node)
        if (canShowMenu) {
          this.showContextMenu(true)
        }
      })
    )
    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('footnote-text')
    this.updateContents()
  }

  public updateContents() {
    super.updateContents()
    this.dom.innerHTML = ''
    this.contentDOM && this.dom.appendChild(this.contentDOM)

    const selectionInsideNode = isSelectionInsideNode(
      this.view,
      this.node,
      this.getPos()
    )
    const can = this.props.getCapabilities()
    const canShowMenu = can.editArticle && !isDeleted(this.node)
    if (canShowMenu && selectionInsideNode && !this.isMenuShown) {
      this.showContextMenu(false)
      this.isMenuShown = true
    } else if (!selectionInsideNode && this.isMenuShown) {
      this.props.popper.destroy()
      this.isMenuShown = false
    }
  }

  showContextMenu(autoFocus = false) {
    this.props.popper.destroy()

    const componentProps: ContextMenuProps = {
      actions: [
        {
          label: 'Delete',
          action: () => this.handleDeleteClick(),
          icon: 'Delete',
        },
      ],
    }

    this.contextMenu = ReactSubView(
      this.props,
      ContextMenu,
      componentProps,
      this.node,
      this.getPos,
      this.view,
      ['menu', 'footnote-context-menu']
    )
    this.props.popper.show(
      this.dom,
      this.contextMenu,
      'right-start',
      false,
      [],
      autoFocus
    )
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
      schema.nodes.general_table_footnote
    )[0]
    if (element && !isDeleted(element.node)) {
      const from = tr.mapping.map(pos)
      const to = tr.mapping.map(from + this.node.nodeSize)
      tr.delete(from, to)
    }
    if (footer.node.childCount <= 1 && !isPendingInsert(element.node)) {
      const from = tr.mapping.map(footer.pos)
      const to = tr.mapping.map(from + footer.node.nodeSize)
      tr.delete(from, to)
    }
    this.view.dispatch(tr)
  }
}

export default createNodeView(GeneralTableFootnoteView)
