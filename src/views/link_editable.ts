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

import { LinkNode } from '@manuscripts/transform'
import { TextSelection } from 'prosemirror-state'

import { LinkForm, LinkValue } from '../components/views/LinkForm'
import { createEditableNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import { LinkView } from './link'
import ReactSubView from './ReactSubView'

export class LinkEditableView extends LinkView<EditableBlockProps> {
  protected popperContainer: HTMLDivElement

  public selectNode = () => {
    this.showForm()
  }

  public destroy = () => {
    this.closeForm()
  }

  public deselectNode = () => {
    this.closeForm()
  }

  private showForm = (event?: Event) => {
    if (event) {
      event.preventDefault()
    }

    if (!this.props.getCapabilities().editArticle) {
      return
    }

    const originalValue: LinkValue = {
      href: this.node.attrs.href,
      title: this.node.attrs.title,
      text: this.node.textContent,
    }

    const componentProps = {
      value: originalValue,
      handleCancel: this.handleCancel,
      handleRemove: this.handleRemove,
      handleSave: this.handleSave,
    }

    this.popperContainer = ReactSubView(
      this.props,
      LinkForm,
      componentProps,
      this.node,
      this.getPos,
      this.view,
      'link-editor'
    )

    this.props.popper.show(this.dom, this.popperContainer, 'bottom')
  }

  private handleCancel = () => {
    const tr = this.view.state.tr
    const pos = this.getPos()
    tr.setSelection(TextSelection.create(tr.doc, pos))
    this.view.focus()
    this.view.dispatch(tr)
    this.closeForm()
  }

  private handleRemove = () => {
    const tr = this.view.state.tr
    const pos = this.getPos()
    const to = pos + this.node.nodeSize
    tr.replaceWith(pos, to, this.node.content).setSelection(
      TextSelection.create(tr.doc, pos)
    )
    this.view.focus()
    this.view.dispatch(tr)
    this.closeForm()
  }

  private handleSave = (value: LinkValue) => {
    const tr = this.view.state.tr

    const link = this.node as LinkNode
    const pos = this.getPos()

    if (value.href !== link.attrs.href || value.title !== link.attrs.title) {
      tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        href: value.href,
        title: value.title,
      })
    }

    if (value.text !== link.textContent) {
      tr.insertText(value.text, pos + 1, pos + this.node.nodeSize - 1)
    }

    tr.setSelection(TextSelection.create(tr.doc, pos))

    this.view.focus()

    this.view.dispatch(tr)

    this.closeForm()
  }

  private closeForm = () => {
    this.props.popper.destroy()
    this.popperContainer?.remove()
  }
}

export default createEditableNodeView(LinkEditableView)
