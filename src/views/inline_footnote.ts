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
import {
  FootnoteNode,
  InlineFootnoteNode,
  isTableElementNode,
  ManuscriptNodeView,
} from '@manuscripts/transform'

import { insertFootnote } from '../commands'
import {
  FootnotesSelector,
  FootnotesSelectorProps,
} from '../components/views/FootnotesSelector'
import {
  findFootnotesContainerNode,
  getFootnotesElementState,
} from '../lib/footnotes'
import {
  getChangeClasses,
  isDeleted,
  isPendingInsert,
} from '../lib/track-changes-utils'
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

export class InlineFootnoteView
  extends BaseNodeView<Trackable<InlineFootnoteNode>>
  implements ManuscriptNodeView
{
  protected popperContainer: HTMLDivElement
  isTableFootnote: boolean

  public showContextMenu = () => {
    this.props.popper.destroy()
    const componentProps: ContextMenuProps = {
      actions: [
        {
          label: 'Edit',
          action: () => {
            this.props.popper.destroy()
            this.showFootnotesSelector()
          },
          icon: 'Edit',
        },
        // {
        //   label: 'Scroll to the footnote',
        //   action: () => {
        //     this.props.popper.destroy()
        //     this.scrollToReferenced()
        //   },
        //   icon: 'Icon TBD',
        // }
      ],
    }
    this.props.popper.show(
      this.dom,
      ReactSubView(
        this.props,
        ContextMenu,
        componentProps,
        this.node,
        this.getPos,
        this.view,
        'context-menu'
      ),
      'right-start',
      false
    )
  }

  public handleClick = () => {
    if (isDeleted(this.node)) {
      return
    }
    if (this.isTableFootnote) {
      this.showFootnotesSelector()
    } else {
      this.showContextMenu()
    }
  }

  showFootnotesSelector = () => {
    if (!this.props.getCapabilities().editArticle) {
      return
    }

    const state = this.view.state
    const pos = this.getPos()
    const container = findFootnotesContainerNode(state.doc, pos)
    const fn = getFootnotesElementState(state, container.node.attrs.id)
    if (!fn) {
      return []
    }

    let footnotes = fn.footnotes.map((n) => n[0])
    if (!this.isTableFootnote) {
      footnotes = footnotes.filter((n) => fn.unusedFootnoteIDs.has(n.attrs.id))
    }

    const props: FootnotesSelectorProps = {
      footnotes,
      inlineFootnote: this.node,
      labels: fn.labels,
      onCancel: this.handleCancel,
      onAdd: this.handleAdd,
      onInsert: this.handleInsert,
      addNewLabel: 'Replace with new footnote',
    }

    this.popperContainer = ReactSubView(
      this.props,
      FootnotesSelector,
      props,
      this.node,
      this.getPos,
      this.view,
      'footnote-editor'
    )
    this.props.popper.show(this.dom, this.popperContainer, 'auto', false)
  }

  public updateContents = () => {
    this.dom.className = [
      'footnote-marker',
      ...getChangeClasses(this.node.attrs.dataTracked),
    ].join(' ')

    const state = this.view.state
    const pos = this.getPos()
    const container = findFootnotesContainerNode(state.doc, pos)
    const fn = getFootnotesElementState(state, container.node.attrs.id)
    if (!fn) {
      return
    }

    this.dom.innerText = this.node.attrs.rids
      .map((rid) => fn.labels.get(rid))
      .join(', ')
  }

  public initialise = () => {
    this.dom = this.createDOM()
    this.dom.classList.add('footnote-marker')
    this.dom.addEventListener('click', this.handleClick)
    this.updateContents()
    const container = findFootnotesContainerNode(
      this.view.state.doc,
      this.getPos()
    )
    this.isTableFootnote = isTableElementNode(container.node)
  }

  public ignoreMutation = () => true

  public createDOM = () => {
    return document.createElement('span')
  }

  public destroy = () => {
    this.props.popper.destroy()
    this.popperContainer?.remove()
  }

  handleCancel = () => {
    const tr = this.view.state.tr
    const rids = this.node.attrs.rids
    if (!rids.length) {
      const pos = this.getPos()
      tr.delete(pos, pos + this.node.nodeSize)
      this.view.dispatch(tr)
    }
    this.destroy()
  }

  handleAdd = () => {
    const state = this.view.state
    const pos = this.getPos()
    const container = findFootnotesContainerNode(state.doc, pos)
    const fn = getFootnotesElementState(state, container.node.attrs.id)
    if (!fn) {
      return
    }
    const tr = this.view.state.tr
    const footnote = insertFootnote(tr, fn.element)
    tr.setNodeAttribute(tr.mapping.map(pos), 'rids', [footnote.node.attrs.id])
    this.view.dispatch(tr)
    this.view.focus()
    this.destroy()
  }

  handleInsert = (footnotes: FootnoteNode[]) => {
    if (footnotes.length) {
      const pos = this.getPos()
      const rids = footnotes.map((note) => note.attrs.id)
      const tr = this.view.state.tr
      if (rids.length) {
        tr.setNodeAttribute(pos, 'rids', rids)
        this.view.dispatch(tr)
      } else if (isPendingInsert(this.node)) {
        tr.delete(pos, pos + this.node.nodeSize)
        this.view.dispatch(tr)
      }
    }
    this.destroy()
  }
}

export default createNodeView(InlineFootnoteView)
