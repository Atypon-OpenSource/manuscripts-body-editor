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

import { ManuscriptNode, schema } from '@manuscripts/transform'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'

import { draggableIcon } from '../icons'
import {
  addInteractionHandlers,
  createFileHandlers,
  createFileUploader,
  createMediaPlaceholder,
  createReactTools,
  createUnsupportedFormat,
  MediaType,
} from '../lib/media'
import { createEditableNodeView } from './creators'
import { FigureView } from './figure'
import { isDeleted } from '@manuscripts/track-changes-plugin'

export class FigureEditableView extends FigureView {
  public reactTools: HTMLDivElement | null = null
  positionMenuWrapper: HTMLDivElement
  figurePosition: string
  private dragHandle: HTMLDivElement | undefined
  private static currentDragFigureId: string | null = null
  private dragAndDropInitialized = false

  public initialise() {
    this.upload = this.upload.bind(this)
    this.createDOM()
    this.updateContents()
    const domElement = this.dom as HTMLElement & {
      __figureView?: FigureEditableView
    }
    domElement.__figureView = this
  }

  public update(newNode: ManuscriptNode): boolean {
    const handledBySuper = super.update(newNode)
    if (handledBySuper) {
      this.addTools()
    }
    return handledBySuper
  }

  private clearTargetClass(
    target: Element,
    classes: string[] = ['drop-target-above', 'drop-target-below']
  ) {
    target.classList.remove(...classes)
  }

  private handleDragStart() {
    const figureId = this.node.attrs.id
    FigureEditableView.currentDragFigureId = figureId
    this.container.classList.add('dragging')
    // Add drag-active to siblings only
    const parent = this.container.parentElement
    if (parent) {
      const siblingFigures = parent.querySelectorAll('.figure')
      siblingFigures.forEach((el) => {
        if (el !== this.container) {
          el.classList.add('drag-active')
        }
      })
    }
  }

  private setupDragAndDrop() {
    this.container.draggable = true

    // Drag events for container
    this.container.addEventListener('dragstart', () => {
      // Only start figure dragging if we have a figure ID and figure is not deleted
      if (this.node.attrs.id && !isDeleted(this.node)) {
        this.handleDragStart()
      }
    })

    // Drag events for drag handle (if present)
    if (this.dragHandle) {
      this.dragHandle.addEventListener('dragstart', () => {
        this.handleDragStart()
      })
    }

    this.container.addEventListener('dragend', () => {
      // Clear the static variable when drag ends
      FigureEditableView.currentDragFigureId = null
      this.clearTargetClass(this.container, ['dragging'])
      const parent = this.container.parentElement
      if (parent) {
        const figures = parent.querySelectorAll('.figure')
        figures.forEach((el) => {
          this.clearTargetClass(el, [
            'drag-active',
            'drop-target-above',
            'drop-target-below',
          ])
        })
      }
      // TODO: Check if setting decorations will work for this case
    })

    this.container.addEventListener('dragover', (e) => {
      // Only handle figure drops when we're dragging a figure (to avoid conflicts with other drag events for image)
      if (FigureEditableView.currentDragFigureId) {
        e.preventDefault()
        e.stopPropagation()
        const rect = this.container.getBoundingClientRect()
        const relativeY = e.clientY - rect.top
        const isAbove = relativeY < rect.height / 2
        this.clearTargetClass(this.container)
        this.container.classList.add(
          isAbove ? 'drop-target-above' : 'drop-target-below'
        )
      }
    })

    this.container.addEventListener('dragleave', (e) => {
      if (!this.container.contains(e.relatedTarget as Node)) {
        this.clearTargetClass(this.container)
      }
    })

    this.container.addEventListener('drop', (e) => {
      // Only handle figure drops when we're dragging a figure (to avoid conflicts with other drop events for image)
      if (!FigureEditableView.currentDragFigureId) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      // Get figure ID from static variable
      const figureId = FigureEditableView.currentDragFigureId

      if (!figureId) {
        return
      }

      const figure = this.getFigureById(figureId)
      if (!figure) {
        return
      }
      const toPos = this.getPos()
      if (figure.pos === toPos) {
        return
      } // prevent self-move

      this.moveFigure(figure.pos, figure.node, toPos)
      this.clearTargetClass(this.container)
    })
  }

  private getFigureById(
    figureId: string
  ): { pos: number; node: ManuscriptNode } | null {
    let result: { pos: number; node: ManuscriptNode } | null = null
    this.view.state.doc.descendants((node, pos) => {
      if (node.type === schema.nodes.figure && node.attrs.id === figureId) {
        result = { pos, node }
        return false // Stop descending into children
      }
      if (result) {
        return false // Stop entire traversal since we found the result
      }
    })
    return result
  }

  private moveFigure(
    fromPos: number,
    fromNode: ManuscriptNode,
    targetPos: number
  ) {
    const { state } = this.view
    const { tr } = state

    tr.delete(fromPos, fromPos + fromNode.nodeSize)
    tr.insert(this.view.state.tr.mapping.map(targetPos), fromNode)
    this.view.dispatch(tr)
  }

  upload = async (file: File) => {
    const result = await this.props.fileManagement.upload(file)
    this.setSrc(result.id)
  }

  public updateContents() {
    super.updateContents()
    this.clearTargetClass(this.container, ['dragging'])

    // Setup drag and drop if capabilities allow, not already initialized
    if (
      this.props.getCapabilities().editArticle &&
      !this.dragAndDropInitialized
    ) {
      this.setupDragAndDrop()
      this.dragAndDropInitialized = true
    }

    const src = this.node.attrs.src
    const files = this.props.getFiles()
    const file = src && files.filter((f) => f.id === src)[0]

    this.container.innerHTML = ''

    const can = this.props.getCapabilities()

    const link = file && this.props.fileManagement.previewLink(file)
    const img = link
      ? this.createImg(link)
      : file
        ? this.createUnsupportedFormat(file.name)
        : this.createPlaceholder()

    if (can.uploadFile && !isDeleted(this.node)) {
      addInteractionHandlers(img, this.upload, 'image/*')
    }

    this.container.innerHTML = ''
    this.container.appendChild(img)

    this.addTools()
  }

  public addTools() {
    this.manageReactTools()

    const existingDragHandlers =
      this.container.querySelectorAll('.drag-handler')
    existingDragHandlers.forEach((handler) => handler.remove())

    const $pos = this.view.state.doc.resolve(this.getPos())

    const parent = $pos.parent
    // Create drag handle for figure elements with multiple figures (not simple image)
    if (
      this.props.getCapabilities()?.editArticle &&
      parent.type === schema.nodes.figure_element &&
      !isDeleted(this.node) &&
      this.countFigures() > 1
    ) {
      const dragHandle = document.createElement('div')
      dragHandle.className = 'drag-handler'
      dragHandle.innerHTML = draggableIcon
      dragHandle.draggable = true

      dragHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation()
      })

      this.container.appendChild(dragHandle)
    }
  }

  // Helper function to count non-deleted figures in current figure element
  countFigures() {
    const parent = findParentNodeOfTypeClosestToPos(
      this.view.state.doc.resolve(this.getPos()),
      schema.nodes.figure_element
    )
    let count = 0
    parent?.node.descendants((node) => {
      if (node.type === schema.nodes.figure && !isDeleted(node)) {
        count++
      }
    })
    return count
  }

  private manageReactTools() {
    this.reactTools?.remove()

    const handlers = createFileHandlers(
      this.node.attrs,
      'src',
      this.view,
      this.props,
      this.setSrc
    )

    const can = this.props.getCapabilities()
    if (can.uploadFile) {
      handlers.handleUpload = createFileUploader(this.upload, 'image/*')
    }

    if (can.detachFile) {
      handlers.handleDelete = () => {
        const pos = this.getPos()
        const tr = this.view.state.tr
        tr.delete(pos, pos + this.node.nodeSize)
        this.view.dispatch(tr)
      }
    }
    this.reactTools = createReactTools(
      this.node,
      this.view,
      this.getPos,
      this.props,
      handlers,
      false,
      () => this.countFigures() > 1
    )

    if (this.reactTools) {
      this.dom.insertBefore(this.reactTools, this.dom.firstChild)
    }
  }

  protected setSrc = (src: string) => {
    const { tr } = this.view.state
    const pos = this.getPos()
    tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      src: src,
    })
    this.view.dispatch(tr)
  }

  private createUnsupportedFormat = (name: string) => {
    return createUnsupportedFormat(
      name,
      this.props.getCapabilities().editArticle
    )
  }

  protected createImg = (src: string) => {
    const img = document.createElement('img')
    img.classList.add('figure-image')
    img.src = src
    img.alt = 'figure image'
    return img
  }

  protected createPlaceholder = () => {
    return createMediaPlaceholder(MediaType.Figure)
  }
}

export default createEditableNodeView(FigureEditableView)
