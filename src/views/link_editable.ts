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

import { LinkNode, schema } from '@manuscripts/transform'
import { TextSelection } from 'prosemirror-state'

import {
  LinkForm,
  LinkFormProps,
  LinkValue,
} from '../components/views/LinkForm'
import {
  getActualAttrs,
  getChangeClasses,
  isDeleted,
  isRejectedInsert,
} from '../lib/track-changes-utils'
import { allowedHref } from '../lib/url'
import { createEditableNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import { LinkView } from './link'
import ReactSubView from './ReactSubView'

export class LinkEditableView extends LinkView<EditableBlockProps> {
  protected popperContainer: HTMLDivElement

  public ignoreMutation = () => true

  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public updateContents = () => {
    if (isRejectedInsert(this.node)) {
      this.dom.innerHTML = ''
      return
    }

    const attrs = getActualAttrs(this.node)
    const href = attrs.href
    const title = attrs.title

    const classes = ['link', ...getChangeClasses(this.node.attrs.dataTracked)]
    this.dom.className = classes.join(' ')
    this.dom.setAttribute('href', allowedHref(href) ? href : '')
    this.dom.setAttribute('title', title || '')
  }

  protected createDOM = () => {
    this.dom = document.createElement('a')
    this.dom.addEventListener('click', this.handleClick)
    this.contentDOM = this.dom
  }

  public selectNode = () => {
    if (!isDeleted(this.node)) {
      this.showForm()
    }
  }

  public destroy = () => {
    this.closeForm()
  }

  public deselectNode = () => {
    this.closeForm()
  }

  private showForm = () => {
    if (!this.props.getCapabilities().editArticle) {
      return
    }

    const attrs = getActualAttrs(this.node)

    const value: LinkValue = {
      href: attrs.href,
      title: attrs.title,
      text: this.node.textContent,
    }

    const componentProps: LinkFormProps = {
      value,
      onCancel: this.handleCancel,
      onRemove: this.handleRemove,
      onSave: this.handleSave,
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

  private handleClick = (e: Event) => {
    if (this.props.getCapabilities().editArticle) {
      e.preventDefault()
    }
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
    tr.delete(pos, pos + this.node.nodeSize)
    tr.insert(pos, schema.text(this.node.textContent))
    tr.setSelection(TextSelection.create(tr.doc, pos))
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
      tr.delete(pos + 1, pos + this.node.nodeSize - 1)
      tr.insert(pos + 1, schema.text(value.text))
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
