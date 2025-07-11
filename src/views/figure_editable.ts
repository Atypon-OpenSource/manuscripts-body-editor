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

import {
  ContextMenu,
  ContextMenuProps,
  FileCorruptedIcon,
  ImageDefaultIcon,
  ImageLeftIcon,
  ImageRightIcon,
} from '@manuscripts/style-guide'
import { schema, SupplementNode } from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  FigureOptions,
  FigureOptionsProps,
} from '../components/views/FigureDropdown'
import { FileAttachment } from '../lib/files'
import { isDeleted } from '../lib/track-changes-utils'
import { updateNodeAttrs } from '../lib/view'
import { createEditableNodeView } from './creators'
import { FigureView } from './figure'
import { figureUploader } from './figure_uploader'
import ReactSubView from './ReactSubView'

export enum figurePositions {
  left = 'half-left',
  right = 'half-right',
  default = '',
}

export class FigureEditableView extends FigureView {
  public reactTools: HTMLDivElement
  positionMenuWrapper: HTMLDivElement
  figurePosition: string

  public initialise() {
    this.upload = this.upload.bind(this)
    this.createDOM()
    this.updateContents()
  }

  upload = async (file: File) => {
    const result = await this.props.fileManagement.upload(file)
    this.setSrc(result.id)
  }

  public updateContents() {
    super.updateContents()

    const src = this.node.attrs.src
    const files = this.props.getFiles()
    const file = src && files.filter((f) => f.id === src)[0]
    this.figurePosition = this.node.attrs.type

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
    this.container.appendChild(this.createPositionMenuWrapper())
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
      // Helper function to count non-deleted figures in current figure element
      const countFigures = () => {
        const element = findParentNodeOfTypeClosestToPos(
          this.view.state.doc.resolve(this.getPos()),
          schema.nodes.figure_element
        )
        let count = 0
        element?.node.descendants((node) => {
          if (node.type === schema.nodes.figure && !isDeleted(node)) {
            count++
          }
        })
        return count
      }

      const figureCount = countFigures()

      handleDelete =
        figureCount > 1
          ? () => {
              const currentCount = countFigures()
              const pos = this.getPos()
              if (currentCount <= 1) {
                // prevent deletion if only one figure remains
                return
              }
              const tr = this.view.state.tr
              tr.delete(pos, pos + this.node.nodeSize)
              this.view.dispatch(tr)
            }
          : undefined
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
    const iconHtml = renderToStaticMarkup(
      createElement(FileCorruptedIcon, { className: 'icon' })
    )

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

  createPositionMenuWrapper = () => {
    const can = this.props.getCapabilities()
    this.positionMenuWrapper = document.createElement('div')
    this.positionMenuWrapper.classList.add('position-menu')

    const positionMenuButton = document.createElement('div')
    positionMenuButton.classList.add('position-menu-button')

    let icon
    switch (this.figurePosition) {
      case figurePositions.left:
        icon = ImageLeftIcon
        break
      case figurePositions.right:
        icon = ImageRightIcon
        break
      default:
        icon = ImageDefaultIcon
        break
    }
    if (icon) {
      positionMenuButton.innerHTML = renderToStaticMarkup(createElement(icon))
    }
    if (can.editArticle) {
      positionMenuButton.addEventListener('click', this.showPositionMenu)
    }
    this.positionMenuWrapper.appendChild(positionMenuButton)
    return this.positionMenuWrapper
  }

  showPositionMenu = () => {
    this.props.popper.destroy()
    const figure = this.node

    const componentProps: ContextMenuProps = {
      actions: [
        {
          label: 'Left',
          action: () => {
            this.props.popper.destroy()
            updateNodeAttrs(this.view, schema.nodes.figure, {
              ...figure.attrs,
              type: figurePositions.left,
            })
          },
          icon: 'ImageLeft',
          selected: this.figurePosition === figurePositions.left,
        },
        {
          label: 'Default',
          action: () => {
            this.props.popper.destroy()
            updateNodeAttrs(this.view, schema.nodes.figure, {
              ...figure.attrs,
              type: figurePositions.default,
            })
          },
          icon: 'ImageDefault',
          selected: !this.figurePosition,
        },
        {
          label: 'Right',
          action: () => {
            this.props.popper.destroy()
            updateNodeAttrs(this.view, schema.nodes.figure, {
              ...figure.attrs,
              type: figurePositions.right,
            })
          },
          icon: 'ImageRight',
          selected: this.figurePosition === figurePositions.right,
        },
      ],
    }
    this.props.popper.show(
      this.positionMenuWrapper,
      ReactSubView(
        this.props,
        ContextMenu,
        componentProps,
        this.node,
        this.getPos,
        this.view,
        ['context-menu', 'position-menu']
      ),
      'left',
      false
    )
  }
}

export default createEditableNodeView(FigureEditableView)
