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

import { ManuscriptNode, schema, SupplementNode } from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'

import {
  FigureOptions,
  FigureOptionsProps,
} from '../components/views/FigureDropdown'
import { draggableIcon, fileCorruptedIcon } from '../icons'
import { FileAttachment } from '../lib/files'
import { isDeleted } from '../lib/track-changes-utils'
import { createEditableNodeView } from './creators'
import { FigureView } from './figure'
import { figureUploader } from './figure_uploader'
import ReactSubView from './ReactSubView'

export class FigureEditableView extends FigureView {
  public reactTools: HTMLDivElement
  private dragHandle: HTMLDivElement | undefined
  private static currentDragFigureId: string | null = null
  private dragAndDropInitialized = false

  public initialise() {
    this.upload = this.upload.bind(this)
    this.createDOM()
    this.updateContents()
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
      const handlePlaceholderClick = (event: Event) => {
        const target = event.target as HTMLElement
        if (target.dataset && target.dataset.action) {
          return
        }
        const triggerUpload = figureUploader(this.upload)
        triggerUpload()
      }

      img.addEventListener('click', handlePlaceholderClick)

      img.addEventListener('mouseenter', () => {
        img.classList.toggle('over', true)
      })

      img.addEventListener('mouseleave', () => {
        img.classList.toggle('over', false)
      })

      img.addEventListener('dragenter', (event) => {
        event.preventDefault()
        img.classList.toggle('over', true)
      })

      img.addEventListener('dragleave', () => {
        img.classList.toggle('over', false)
      })

      img.addEventListener('dragover', (e) => {
        if (e.dataTransfer && e.dataTransfer.items) {
          for (const item of e.dataTransfer.items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }
          }
        }
      })

      img.addEventListener('drop', async (e) => {
        if (e.dataTransfer && e.dataTransfer.files.length) {
          e.preventDefault()
          await this.upload(e.dataTransfer.files[0])
        }
      })
    }

    this.container.innerHTML = ''
    this.container.appendChild(img)

    this.addTools()
  }

  protected addTools() {
    this.manageReactTools()
    const $pos = this.view.state.doc.resolve(this.getPos())

    const parent = $pos.parent
    // Create drag handle for for figure elements ( not simple image)
    if (
      this.props.getCapabilities()?.editArticle &&
      parent.type === schema.nodes.figure_element &&
      !isDeleted(this.node)
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
    let handleDownload
    let handleUpload
    let handleReplace
    let handleDetach
    let handleDelete: (() => void) | undefined

    const src = this.node.attrs.src
    const files = this.props.getFiles()
    const file = src && files.filter((f) => f.id === src)[0]

    const can = this.props.getCapabilities()

    if (src) {
      if (file) {
        handleDownload = () => {
          this.props.fileManagement.download(file)
        }
      }
      handleDetach = () => {
        this.setSrc('')
      }
    }
    if (can.replaceFile) {
      handleReplace = (file: FileAttachment, isSupplement = false) => {
        this.setSrc(file.id)
        if (isSupplement) {
          const tr = this.view.state.tr
          this.view.state.doc.descendants((node, pos) => {
            if (node.type === node.type.schema.nodes.supplement) {
              const href = (node as SupplementNode).attrs.href
              if (href === file.id) {
                tr.delete(pos, pos + node.nodeSize)
                this.view.dispatch(tr)
              }
            }

            if (
              node.type !== node.type.schema.nodes.supplements &&
              node.type !== node.type.schema.nodes.manuscript
            ) {
              return false
            }
          })
        }
      }
    }
    if (can.uploadFile) {
      handleUpload = figureUploader(this.upload)
    }

    if (can.detachFile) {
      handleDelete = () => {
        const pos = this.getPos()
        const tr = this.view.state.tr
        tr.delete(pos, pos + this.node.nodeSize)
        this.view.dispatch(tr)
      }
    }

    this.reactTools?.remove()
    if (this.props.dispatch && this.props.theme) {
      const componentProps: FigureOptionsProps = {
        can,
        getDoc: () => this.view.state.doc,
        getFiles: this.props.getFiles,
        onDownload: handleDownload,
        onUpload: handleUpload,
        onDetach: handleDetach,
        onReplace: handleReplace,
        onDelete: handleDelete,
        hasSiblings: () => {
          return this.countFigures() > 1
        },
      }
      this.reactTools = ReactSubView(
        this.props,
        FigureOptions,
        componentProps,
        this.node,
        this.getPos,
        this.view
      )
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
    tr.setSelection(NodeSelection.create(tr.doc, pos))
    this.view.dispatch(tr)
  }

  private createUnsupportedFormat = (name: string) => {
    const element = document.createElement('div')
    element.classList.add('figure', 'placeholder')

    const instructions = document.createElement('div')
    instructions.classList.add('instructions')

    // Convert the React component to a static HTML string
    const iconHtml = fileCorruptedIcon

    instructions.innerHTML = `
    <div>
      <div class="unsupported-icon-wrapper">${iconHtml}</div>
      <div>${name}</div>
      <div class="unsupported-format-label">
        Unsupported file format
      </div>
      <div>
        ${
          this.props.getCapabilities()?.editArticle
            ? 'Click to add image'
            : 'No image here yet…'
        }
      </div>
    </div>
  `

    element.appendChild(instructions)
    return element
  }

  protected createImg = (src: string) => {
    const img = document.createElement('img')
    img.classList.add('figure-image')
    img.src = src
    return img
  }

  protected createPlaceholder = () => {
    const element = document.createElement('div')
    element.classList.add('figure', 'placeholder')

    const instructions = document.createElement('div')
    instructions.classList.add('instructions')
    instructions.innerHTML = `
      <p>Drag or click here to upload image <br>
      or drag items here from the file inspector tabs <br>
      <a data-action='open-other-files'>'Other files'</a> | 
      <a data-action='open-supplement-files'>'Supplements'</a></p>
    `

    element.appendChild(instructions)
    return element
  }
}

export default createEditableNodeView(FigureEditableView)
