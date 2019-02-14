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
import { NodeView } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { NodeViewCreator } from '../types'

class InlineFootnote implements NodeView {
  public dom: HTMLElement

  private readonly props: EditorProps
  private node: ManuscriptNode

  constructor(props: EditorProps, node: ManuscriptNode) {
    this.props = props
    this.node = node

    this.createDOM()
    this.updateContents()
  }

  public update(newNode: ManuscriptNode): boolean {
    if (!newNode.sameMarkup(this.node)) return false
    this.node = newNode
    this.updateContents()
    this.props.popper.update()
    return true
  }

  public selectNode() {
    // TODO: select and scroll to the footnote without changing the URL?
    this.props.history.push('#' + this.node.attrs.rid)
  }

  public deselectNode() {
    this.props.popper.destroy()
  }

  public stopEvent(event: Event) {
    return event.type !== 'mousedown' && !event.type.startsWith('drag')
  }

  public ignoreMutation() {
    return true
  }

  protected get elementType() {
    return 'span'
  }

  protected updateContents() {
    this.dom.textContent = this.node.attrs.contents
  }

  protected createDOM() {
    this.dom = document.createElement(this.elementType)
    this.dom.classList.add('footnote')
  }
}

const inlineFootnote = (props: EditorProps): NodeViewCreator => node =>
  new InlineFootnote(props, node)

export default inlineFootnote
