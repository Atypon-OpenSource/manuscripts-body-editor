/*!
 * © 2025 Atypon Systems LLC
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

import { getFileIcon, LinkIcon } from '@manuscripts/style-guide'
import { SupplementNode } from '@manuscripts/transform'
import { ViewMutationRecord } from 'prosemirror-view'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { openDeleteSupplementDialog } from '../components/views/DeleteSupplementDialog'
import { deleteIcon, draggableIcon } from '../icons'
import { findNodeByID } from '../lib/doc'
import {
  getSupplementDisplayLabel,
  getSupplementNumber,
  isSupplementWeblink,
} from '../lib/supplements'
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class SupplementView extends BaseNodeView<Trackable<SupplementNode>> {
  private metaEl: HTMLDivElement
  private numberEl: HTMLSpanElement
  private labelEl: HTMLSpanElement
  private deleteBtn: HTMLButtonElement | null = null
  private static currentDragSupplementId: string | null = null
  private dragIcon: HTMLDivElement | undefined

  public ignoreMutation(mutation: ViewMutationRecord) {
    if (!this.contentDOM) {
      return true
    }
    const target = mutation.target as Node
    if (this.contentDOM.contains(target) || target === this.contentDOM) {
      return false
    }
    return true
  }

  public initialise() {
    this.createElement()
    this.updateContents()
    this.setupDragAndDrop()
  }

  public createElement = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('supplement-item')
    this.dom.classList.add('block')
    this.dom.setAttribute('id', this.node.attrs.id)
    this.dom.setAttribute('href', this.node.attrs.href)
    this.dom.draggable = true

    this.metaEl = document.createElement('div')
    this.metaEl.classList.add('supplement-meta')
    this.metaEl.contentEditable = 'false'

    this.numberEl = document.createElement('span')
    this.numberEl.classList.add('supplement-number')
    this.metaEl.appendChild(this.numberEl)

    this.labelEl = document.createElement('span')
    this.labelEl.classList.add('supplement-label')
    this.metaEl.appendChild(this.labelEl)

    this.dom.appendChild(this.metaEl)

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('supplement-caption')
    this.dom.appendChild(this.contentDOM)

    this.addDragIcon()
    this.refreshMetadata()
    this.maybeAddDeleteButton()
  }

  public updateContents() {
    super.updateContents()
    this.refreshMetadata()
  }

  public update(newNode: import('@manuscripts/transform').ManuscriptNode) {
    const prevHref = this.node.attrs.href
    const updated = super.update(newNode)
    if (updated && prevHref !== newNode.attrs.href) {
      this.refreshMetadata()
    }
    return updated
  }

  private refreshMetadata() {
    const pos = this.getPos()
    const number = getSupplementNumber(this.view.state.doc, pos)
    this.numberEl.textContent = `Supplement ${number}`

    const href = this.node.attrs.href
    const isWeblink = isSupplementWeblink(href)

    if (isWeblink) {
      this.labelEl.textContent = ''
      this.labelEl.hidden = true
    } else {
      this.labelEl.hidden = false
      this.labelEl.textContent = getSupplementDisplayLabel(
        this.node,
        this.props.getFiles()
      )
    }

    Array.from(this.metaEl.children).forEach((child) => {
      if (
        child !== this.numberEl &&
        child !== this.labelEl &&
        child !== this.deleteBtn
      ) {
        child.remove()
      }
    })

    if (isWeblink) {
      const iconElement = document.createElement('span')
      iconElement.classList.add('supplement-url-icon')
      iconElement.innerHTML = renderToStaticMarkup(React.createElement(LinkIcon))
      this.metaEl.appendChild(iconElement)

      const link = document.createElement('a')
      link.classList.add('supplement-url')
      link.href = href
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.textContent = href
      this.metaEl.appendChild(link)
      return
    }

    const files = this.props.getFiles()
    const file = files.find((f) => f.id === href)
    if (file) {
      const fileRow = document.createElement('span')
      fileRow.classList.add('supplement-file-row')

      const iconElement = document.createElement('span')
      iconElement.classList.add('supplement-file-icon')
      const icon = getFileIcon(file.name)
      if (icon) {
        iconElement.innerHTML = renderToStaticMarkup(icon)
      }
      fileRow.appendChild(iconElement)

      const fileName = document.createElement('span')
      fileName.classList.add('supplement-file-name')
      fileName.textContent = file.name
      fileRow.appendChild(fileName)

      this.metaEl.appendChild(fileRow)
    }
  }

  private maybeAddDeleteButton() {
    if (!this.props.getCapabilities()?.editArticle) {
      return
    }

    const button = document.createElement('button')
    button.type = 'button'
    button.classList.add('supplement-delete-btn', 'button-reset')
    button.setAttribute('aria-label', 'Delete supplement')
    button.innerHTML = deleteIcon
    button.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      openDeleteSupplementDialog(this.view, this.getPos())
    })
    this.metaEl.appendChild(button)
    this.deleteBtn = button
  }

  private getDropSide(element: Element, clientY: number): 'before' | 'after' {
    const { top, bottom } = element.getBoundingClientRect()
    const middleY = (top + bottom) / 2
    return clientY > middleY ? 'after' : 'before'
  }

  private noActualMove(
    currentPos: number,
    nodeSize: number,
    targetPos: number
  ): boolean {
    return targetPos === currentPos || targetPos === currentPos + nodeSize
  }

  private handleDragStart() {
    const supplementId = this.node.attrs.id
    SupplementView.currentDragSupplementId = supplementId
    this.dom.classList.add('dragging')
  }

  private setupDragAndDrop() {
    const clearDropClasses = () => {
      this.dom.classList.remove('drop-target-above', 'drop-target-below')
    }

    this.dom.addEventListener('dragstart', () => {
      if (this.node.attrs.id) {
        this.handleDragStart()
      }
    })

    this.dom.addEventListener('dragend', () => {
      SupplementView.currentDragSupplementId = null
      this.dom.classList.remove('dragging')
      clearDropClasses()
    })

    this.dom.addEventListener('dragover', (e) => {
      if (SupplementView.currentDragSupplementId) {
        e.preventDefault()
        e.stopPropagation()
        const side = this.getDropSide(this.dom, e.clientY)
        clearDropClasses()
        this.dom.classList.add(
          side === 'before' ? 'drop-target-above' : 'drop-target-below'
        )
      }
    })

    this.dom.addEventListener('dragleave', (e) => {
      if (!this.dom.contains(e.relatedTarget as Node)) {
        clearDropClasses()
      }
    })

    this.dom.addEventListener('drop', (e) => {
      if (!SupplementView.currentDragSupplementId) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      const supplementId = SupplementView.currentDragSupplementId
      if (!supplementId) {
        return
      }
      const { state } = this.view
      const supplement = findNodeByID(state.doc, supplementId)
      if (!supplement) {
        return
      }

      const toPos = this.getPos()

      const side = this.getDropSide(this.dom, e.clientY)
      const targetPos = side === 'before' ? toPos : toPos + this.node.nodeSize

      if (
        this.noActualMove(supplement.pos, supplement.node.nodeSize, targetPos)
      ) {
        clearDropClasses()
        return
      }
      this.moveSupplement(
        supplement.pos,
        supplement.node as SupplementNode,
        targetPos
      )
      clearDropClasses()
    })
  }

  private moveSupplement(
    fromPos: number,
    fromNode: SupplementNode,
    targetPos: number
  ) {
    const { state } = this.view
    const { tr } = state

    tr.insert(targetPos, fromNode)

    const mappedFrom = tr.mapping.map(fromPos, -1)

    tr.delete(mappedFrom, mappedFrom + fromNode.nodeSize)

    this.view.dispatch(tr)
  }

  private addDragIcon() {
    if (this.dragIcon) {
      this.dragIcon.remove()
      this.dragIcon = undefined
    }

    const dragIcon = document.createElement('div')
    dragIcon.className = 'drag-icon'
    dragIcon.innerHTML = draggableIcon
    dragIcon.draggable = false

    dragIcon.addEventListener('mousedown', (e) => {
      e.stopPropagation()
    })

    this.dragIcon = dragIcon
    this.dom.appendChild(dragIcon)
  }
}

export default createNodeView(SupplementView)
