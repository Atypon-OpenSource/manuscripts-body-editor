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

import BlockView from './block_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import { FigureProps } from './figure_editable'

export class TableElementView extends BlockView<
  EditableBlockProps & FigureProps
> {
  public elementType = 'figure'

  public createElement = () => {
    this.contentDOM = document.createElement('figure')
    this.contentDOM.classList.add('block')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.dom.appendChild(this.contentDOM)
  }

  public updateContents = () => {
    const { suppressHeader, suppressFooter } = this.node.attrs

    this.dom.classList.toggle('suppress-header', suppressHeader)
    this.dom.classList.toggle('suppress-footer', suppressFooter)

    if (this.contentDOM) {
      this.contentDOM.setAttribute(
        'data-paragraph-style',
        this.node.attrs.paragraphStyle
      )
      this.contentDOM.setAttribute(
        'data-table-style',
        this.node.attrs.tableStyle
      )
    }
  }
}

export default createNodeView(TableElementView)
