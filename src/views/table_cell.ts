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
import { DOMSerializer, ResolvedPos } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'

import {
  ContextMenu,
  ContextMenuButton,
} from '../components/views/TableCellContextMenu'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'

export class TableCellView extends BlockView<EditableBlockProps> {
  public contentDOM: HTMLElement

  public initialise = () => {
    if (!this.node.type.spec.toDOM) {
      return
    }
    const outputSpec = this.node.type.spec.toDOM(this.node)
    const { dom } = DOMSerializer.renderSpec(document, outputSpec)
    this.dom = dom as HTMLElement
    this.contentDOM = document.createElement('span')
    this.dom.appendChild(this.contentDOM)

    if (isInTable(this.view.state.doc.resolve(this.getPos()))) {
      this.createContextMenu()
    }
  }

  private createContextMenu() {
    const contextMenuButton = ReactSubView(
      { ...this.props, dispatch: this.view.dispatch },
      ContextMenuButton,
      {
        toggleOpen: () => {
          if (this.props.popper.isActive()) {
            this.props.popper.destroy()
          } else {
            this.view.dispatch(
              this.view.state.tr.setSelection(
                TextSelection.create(this.view.state.doc, this.getPos())
              )
            )
            this.view.focus()
            const contextMenu = ReactSubView(
              { ...this.props, dispatch: this.view.dispatch },
              ContextMenu,
              { view: this.view },
              this.view.state.selection.$from.node(),
              this.getPos,
              this.view,
              'table-cell-context-menu'
            )

            this.props.popper.show(
              contextMenuButton,
              contextMenu,
              'right',
              false
            )
          }
        },
      },
      this.view.state.selection.$from.node(),
      this.getPos,
      this.view
    )
    this.dom.appendChild(contextMenuButton)
  }
}

const isInTable = ($pos: ResolvedPos) => {
  const depth = $pos.depth
  const node = $pos.node(depth)
  if (node.type === schema.nodes.table_row) {
    const table = $pos.node(depth - 1)
    return !(table.firstChild === node || table.lastChild === node)
  }
}

export default createNodeView(TableCellView)
