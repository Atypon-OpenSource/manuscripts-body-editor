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
import { FootnoteNode, ManuscriptNode, schema } from '@manuscripts/transform'
import { isEqual } from 'lodash'
import { NodeSelection, Transaction } from 'prosemirror-state'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'

import {
  DeleteFootnoteDialog,
  DeleteFootnoteDialogProps,
} from '../components/views/DeleteFootnoteDialog'
import { alertIcon } from '../icons'
import { getFootnotesElementState } from '../lib/footnotes'
import { isDeleted } from '../lib/track-changes-utils'
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

export class FootnoteView extends BaseNodeView<Trackable<FootnoteNode>> {
  dialog: HTMLElement
  contextMenu: HTMLDivElement

  public initialise = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('footnote')
    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('footnote-text')
    this.dom.addEventListener('mousedown', this.handleClick)
    this.updateContents()
  }

  public updateContents() {
    super.updateContents()

    const { id, fn } = this.getFootnoteState()

    if (!fn) {
      return
    }

    const marker = document.createElement('span')
    if (!isDeleted(this.node) && fn.unusedFootnoteIDs.has(id)) {
      marker.classList.add('uncited-footnote')
      marker.innerHTML = alertIcon
    } else {
      marker.classList.add('footnote-marker')
      marker.innerText = fn.labels.get(id) || ''
    }

    this.dom.innerHTML = ''
    this.dom.appendChild(marker)
    this.contentDOM && this.dom.appendChild(this.contentDOM)
  }

  getFootnoteState() {
    const id = this.node.attrs.id
    const fn = getFootnotesElementState(this.view.state, id)
    return { id, fn }
  }

  showContextMenu(element: HTMLElement) {
    this.props.popper.destroy()

    const can = this.props.getCapabilities()
    const { id, fn } = this.getFootnoteState()

    const componentProps: ContextMenuProps = {
      actions: [],
    }
    if (!fn?.unusedFootnoteIDs.has(id)) {
      componentProps.actions.push({
        label: 'Go to footnote Refernce',
        action: () => this.handleMarkerClick(),
        icon: 'Scroll',
      })
    }
    if (can.editArticle) {
      componentProps.actions.push({
        label: 'Delete',
        action: () => this.handleDelete(),
        icon: 'Delete',
      })
    }

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

  handleClick = (event: Event) => {
    const element = event.target as HTMLElement
    const item = element.closest('.footnote')
    if (item) {
      this.showContextMenu(item as HTMLElement)
    }
  }

  handleMarkerClick = (e?: Event) => {
    e?.preventDefault()
    e?.stopPropagation()

    const id = this.node.attrs.id
    const fn = getFootnotesElementState(this.view.state, id)

    if (!fn) {
      return
    }

    for (const [node, pos] of fn.inlineFootnotes) {
      if (node.attrs.rids.includes(id)) {
        const tr = this.view.state.tr
        const selection = NodeSelection.create(this.view.state.doc, pos)
        tr.setSelection(selection)
        tr.scrollIntoView()
        this.view.dispatch(tr)
      }
    }
  }

  handleDeleteClick = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
    const componentProps: DeleteFootnoteDialogProps = {
      header: 'Delete footnote',
      message:
        'This action will entirely remove the footnote from the list because it will no longer be used.',
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
    this.deleteInlineFootnotes(tr)
    this.deleteFootnote(tr)
    this.view.dispatch(tr)
  }

  deleteInlineFootnotes = (tr: Transaction) => {
    const id = this.node.attrs.id
    const fns = getFootnotesElementState(this.view.state, this.node.attrs.id)
    fns?.inlineFootnotes.forEach(([node, pos]) => {
      pos = tr.mapping.map(pos)
      const rids = node.attrs.rids.filter((rid) => rid !== id)
      if (isEqual(rids, node.attrs.rids)) {
        return
      }
      if (!rids.length) {
        tr.delete(pos, pos + node.nodeSize)
      } else {
        tr.setNodeAttribute(pos, 'rids', rids)
      }
    })
  }

  deleteFootnote = (tr: Transaction) => {
    const pos = tr.mapping.map(this.getPos())
    const $pos = tr.doc.resolve(pos)
    const element = findParentNodeOfTypeClosestToPos(
      $pos,
      schema.nodes.footnotes_element
    )
    if (element && getEffectiveChildCount(element.node) <= 1) {
      tr.delete(element.pos, element.pos + element.node.nodeSize)
    } else {
      tr.delete(pos, pos + this.node.nodeSize)
    }
  }
}

const getEffectiveChildCount = (node: ManuscriptNode) => {
  let count = 0
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i)
    if (!isDeleted(child)) {
      count++
    }
  }
  return count
}

export default createNodeView(FootnoteView)
