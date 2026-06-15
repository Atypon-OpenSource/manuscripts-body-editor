/*!
 * © 2026 Atypon Systems LLC
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
import { ManuscriptNode } from '@manuscripts/transform'
import { EditorView } from 'prosemirror-view'

import { findNodeByID } from './doc'

interface DragDropContext {
  view: EditorView
  node: ManuscriptNode
  pos: number
}

interface DragDropConfig {
  element: HTMLElement
  getContext: () => DragDropContext
  disabled?: boolean
}

export class DragDropManager {
  private static currentNodeId: string | null

  private element: HTMLElement
  private getContext: () => DragDropContext

  setup(config: DragDropConfig) {
    const { element, getContext, disabled } = config
    if (disabled) {
      return
    }

    this.element = element
    this.element.draggable = true
    this.getContext = getContext

    const abortController = new AbortController()
    const signal = abortController.signal

    element.addEventListener('dragstart', this.handleDragStart, { signal })
    element.addEventListener('dragend', this.handleDragEnd, { signal })
    element.addEventListener('dragover', this.handleDragOver, { signal })
    element.addEventListener('dragleave', this.handleDragLeave, { signal })
    element.addEventListener('drop', this.handleDrop, { signal })

    return () => {
      DragDropManager.currentNodeId = null
      abortController.abort()
    }
  }

  private handleDragStart = () => {
    DragDropManager.currentNodeId = this.getContext().node.attrs.id
    this.element.classList.add('dragging')
  }

  private handleDragEnd = () => {
    DragDropManager.currentNodeId = null
    this.element.classList.remove('dragging')
    this.clearDropClasses()
  }

  private handleDragOver = (e: DragEvent) => {
    const draggedId = DragDropManager.currentNodeId
    const nodeId = this.getContext().node.attrs.id
    if (draggedId === null || draggedId === nodeId) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const side = this.getDropSide(this.element, e.clientY)
    this.clearDropClasses()
    this.element.classList.add(
      side === 'before' ? 'drop-target-above' : 'drop-target-below'
    )
  }

  private handleDragLeave = (e: DragEvent) => {
    if (this.element.contains(e.relatedTarget as Node)) {
      this.clearDropClasses()
    }
  }

  private handleDrop = (e: DragEvent) => {
    if (DragDropManager.currentNodeId === null) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const {
      view: { state },
      node,
      pos: toPos,
    } = this.getContext()
    const currentView = findNodeByID(state.doc, DragDropManager.currentNodeId)
    if (!currentView) {
      return
    }

    const side = this.getDropSide(this.element, e.clientY)
    const targetPos = side === 'before' ? toPos : toPos + node.nodeSize

    const { node: fromNode, pos: fromPos } = currentView
    // No-move if dropping at the node’s start or end position
    const noActualMove =
      targetPos === fromPos || targetPos === fromPos + fromNode.nodeSize
    // Check if this would be a no actual position change
    if (noActualMove) {
      this.clearDropClasses()
      return
    }
    this.moveNode(fromNode, fromPos, targetPos)
    this.clearDropClasses()
  }

  private clearDropClasses() {
    this.element.classList.remove('drop-target-above', 'drop-target-below')
  }

  private getDropSide(
    element: HTMLElement,
    clientY: number
  ): 'before' | 'after' {
    const { top, bottom } = element.getBoundingClientRect()
    const middleY = (top + bottom) / 2
    return clientY > middleY ? 'after' : 'before'
  }

  private moveNode(
    fromNode: ManuscriptNode,
    fromPos: number,
    targetPos: number
  ) {
    const view = this.getContext().view
    const { state } = view
    const { tr } = state
    tr.insert(targetPos, fromNode)
    const mappedFrom = tr.mapping.map(fromPos, -1)
    tr.delete(mappedFrom, mappedFrom + fromNode.nodeSize)
    view.dispatch(tr)
  }
}
