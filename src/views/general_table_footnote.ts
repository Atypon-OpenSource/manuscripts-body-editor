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

import { GeneralTableFootnote, schema } from '@manuscripts/transform'
import {
  findChildrenByType,
  findParentNodeOfTypeClosestToPos,
} from 'prosemirror-utils'

import {
  DeleteFootnoteDialog,
  DeleteFootnoteDialogProps,
} from '../components/views/DeleteFootnoteDialog'
import { deleteIcon } from '../icons'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

export class GeneralTableFootnoteView extends BaseNodeView<GeneralTableFootnote> {
  dialog: HTMLElement

  public initialise = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('footnote', 'general-table-footnote')
    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('footnote-text')
    this.updateContents()
  }

  public updateContents = () => {
    const deleteBtn = document.createElement('span')
    deleteBtn.classList.add('delete-icon')
    deleteBtn.innerHTML = deleteIcon
    deleteBtn.addEventListener('mousedown', (e) => this.handleClick(e))

    this.dom.innerHTML = ''
    this.contentDOM && this.dom.appendChild(this.contentDOM)
    this.dom.appendChild(deleteBtn)
  }

  handleClick = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
    const componentProps: DeleteFootnoteDialogProps = {
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
    const footer = findParentNodeOfTypeClosestToPos(
      $pos,
      schema.nodes.table_element_footer
    )!
    const footnotes = findChildrenByType(footer.node, schema.nodes.footnote)
    if (footnotes.length) {
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
