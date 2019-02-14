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

import { ManuscriptNode } from '@manuscripts/manuscript-transform'
import { Decoration } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { NodeViewCreator } from '../types'
import Block from './block'

class TableElement extends Block {
  protected get elementType() {
    return 'figure'
  }

  public update(newNode: ManuscriptNode, decorations?: Decoration[]): boolean {
    if (newNode.type.name !== this.node.type.name) return false
    if (newNode.attrs.id !== this.node.attrs.id) return false
    this.handleDecorations(decorations)
    this.node = newNode
    this.updateContents()
    return true
  }

  protected updateContents() {
    const { suppressCaption, suppressHeader, suppressFooter } = this.node.attrs

    this.dom.classList.toggle('suppress-caption', suppressCaption)
    this.dom.classList.toggle('suppress-header', suppressHeader)
    this.dom.classList.toggle('suppress-footer', suppressFooter)
  }

  protected createElement() {
    this.contentDOM = document.createElement('figure')
    this.contentDOM.classList.add('block')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.contentDOM.setAttribute(
      'data-paragraph-style',
      this.node.attrs.paragraphStyle
    )
    this.contentDOM.setAttribute('data-table-style', this.node.attrs.tableStyle)
    this.dom.appendChild(this.contentDOM)
  }
}

const tableElement = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new TableElement(props, node, view, getPos)

export default tableElement
