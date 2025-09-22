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

import { getFileIcon } from '@manuscripts/style-guide'
import { SupplementNode } from '@manuscripts/transform'
import { renderToStaticMarkup } from 'react-dom/server'

import { draggableIcon } from '../icons'
import { findNodeByID } from '../lib/doc'
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class SupplementView extends BaseNodeView<Trackable<SupplementNode>> {
  private supplementInfoEl: HTMLDivElement
  private static currentDragSupplementId: string | null = null
  private dragAndDropInitialized = false
  private dragIcon: HTMLDivElement | undefined

  public ignoreMutation = () => true

  public initialise() {
    this.createElement()
    this.updateContents()
  }

  public createElement = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('supplement-item')
    this.dom.classList.add('block')
    this.dom.setAttribute('id', this.node.attrs.id)
    this.dom.setAttribute('href', this.node.attrs.href)
    this.dom.draggable = true

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('supplement-caption')
    this.dom.appendChild(this.contentDOM)

    this.addFileInfo()
    this.addDragIcon()
  }

  public updateContents() {
    super.updateContents()
    this.refreshFileInfo()

    if (!this.dragAndDropInitialized) {
      this.setupDragAndDrop()
      this.dragAndDropInitialized = true
    }
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
    // No-move if dropping at the node’s start or end position
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

      // Check if this would be a no actual position change
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

  private addFileInfo() {
    this.supplementInfoEl = document.createElement('div')
    this.supplementInfoEl.classList.add('supplement-file-info')
    this.supplementInfoEl.contentEditable = 'false'

    // Get the file from the file management system
    const files = this.props.getFiles()
    const file = files.find((f) => f.id === this.node.attrs.href)

    if (file) {
      const iconElement = document.createElement('span')
      iconElement.classList.add('supplement-file-icon')

      const icon = getFileIcon(file.name)
      if (icon) {
        iconElement.innerHTML = renderToStaticMarkup(icon)
      }

      this.supplementInfoEl.appendChild(iconElement)

      // Add file name
      const fileName = document.createElement('span')
      fileName.classList.add('supplement-file-name')
      fileName.textContent = file.name
      this.supplementInfoEl.appendChild(fileName)
    } else {
      // Show placeholder if file not found
      const placeholder = document.createElement('span')
      placeholder.textContent = 'File not found'
      this.supplementInfoEl.appendChild(placeholder)
    }

    // Add file info to the supplement-item
    this.dom.appendChild(this.supplementInfoEl)
  }

  private refreshFileInfo() {
    this.supplementInfoEl.remove()

    // Rebuild with the latest attrs
    this.addFileInfo()
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
