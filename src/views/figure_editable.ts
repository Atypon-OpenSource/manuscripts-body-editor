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
  PlusIcon,
} from '@manuscripts/style-guide'
import { schema } from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  FigureOptions,
  FigureOptionsProps,
} from '../components/views/FigureDropdown'
import { FileAttachment, groupFiles } from '../lib/files'
import { isDeleted } from '../lib/track-changes-utils'
import { updateNodeAttrs } from '../lib/view'
import { createEditableNodeView } from './creators'
import { FigureView } from './figure'
import { figureUploader } from './figure_uploader'
import ReactSubView from './ReactSubView'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'

export enum figurePositions {
  left = 'half-left',
  right = 'half-right',
  default = '',
}

export class FigureEditableView extends FigureView {
  public reactTools: HTMLDivElement
  positionMenuWrapper: HTMLDivElement
  figurePosition: string
  addImageButton: HTMLButtonElement | null = null
  imagesContainer: HTMLDivElement
  imageToolContainers: Map<number, HTMLDivElement> = new Map()

  public initialise() {
    this.upload = this.upload.bind(this)
    this.createDOM()
    this.updateContents()
  }

  upload = async (file: File, index = 0): Promise<void> => {
    try {
      const result = await this.props.fileManagement.upload(file)
      this.addImage(result.id, index)
    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    }
  }

  public updateContents() {
    super.updateContents()

    const src = this.node.attrs.src || ''
    const images = Array.isArray(src) ? src : [src]
    const files = this.props.getFiles()
    this.figurePosition = this.node.attrs.type
    const can = this.props.getCapabilities()

    this.container.innerHTML = ''
    this.imageToolContainers.clear()

    this.imagesContainer = document.createElement('div')
    this.imagesContainer.classList.add('figure-images-container')

    images.forEach((imageSrc, index) => {
      const file = imageSrc && files.find((f) => f.id === imageSrc)
      const imgContainer = document.createElement('div')
      imgContainer.classList.add('figure-image-container')

      const imgElement = imageSrc
        ? file
          ? this.props.fileManagement.previewLink(file)
            ? this.createImg(
                this.props.fileManagement.previewLink(file) as string
              )
            : this.createUnsupportedFormat(file, index)
          : this.createPlaceholder(index)
        : this.createPlaceholder(index)

      imgContainer.appendChild(imgElement)

      if (can.editArticle && !isDeleted(this.node) && file) {
        const toolContainer = this.createImageToolContainer(index, file)
        imgContainer.appendChild(toolContainer)
        this.imageToolContainers.set(index, toolContainer)
      }

      this.imagesContainer.appendChild(imgContainer)
    })

    if (can.uploadFile && !isDeleted(this.node)) {
      const lastImage = images[images.length - 1]
      const isLastPlaceholderEmpty = lastImage === '' || !lastImage
      const parent = findParentNodeOfTypeClosestToPos(
        this.view.state.tr.doc.resolve(this.getPos()),
        schema.nodes.figure_element
      )

      if (!this.addImageButton) {
        if (parent?.node.type === schema.nodes.figure_element) {}
        this.addImageButton = document.createElement('button')
        this.addImageButton.classList.add('add-image-button')
        this.addImageButton.innerHTML = renderToStaticMarkup(
          createElement(PlusIcon, { className: 'icon' })
        )
        this.addImageButton.title = 'Add another image'
        this.addImageButton.addEventListener('click', () => {
          this.addNewImagePlaceholder()
        })
      }

      if (isLastPlaceholderEmpty) {
        this.addImageButton.classList.add('disabled')
      } else {
        this.addImageButton.classList.remove('disabled')
      }

      if (!this.imagesContainer.contains(this.addImageButton) && 
          parent?.node.type === schema.nodes.figure_element) {
        this.imagesContainer.appendChild(this.addImageButton)
      }
    } else {
      if (this.addImageButton) {
        this.addImageButton.remove()
        this.addImageButton = null
      }
    }

    this.container.appendChild(this.imagesContainer)
    this.addTools()
  }

  private createImageToolContainer(
    index: number,
    file?: FileAttachment
  ): HTMLDivElement {
    const toolContainer = document.createElement('div')
    toolContainer.classList.add('image-tool-container')

    const can = this.props.getCapabilities()
    const files = this.props.getFiles()
    const doc = this.view.state.doc

    if (file) {
      const componentProps: FigureOptionsProps = {
        can,
        files: groupFiles(doc, files),
        onDownload: () => this.props.fileManagement.download(file),
        onUpload: () => {
          const triggerUpload = figureUploader((file: File) =>
            this.upload(file, index)
          )
          triggerUpload()
        },
        onDetach: () => this.detachImage(index),
        onReplace: (newFile: FileAttachment) =>
          this.addImage(newFile.id, index),
      }

      const reactTools = ReactSubView(
        this.props,
        FigureOptions,
        componentProps,
        this.node,
        this.getPos,
        this.view
      )

      toolContainer.appendChild(reactTools)
    }

    return toolContainer
  }

  private addNewImagePlaceholder() {
    const currentImages = this.getCurrentImages()
    this.setImages([...currentImages, ''])
  }

  private addImage(src: string, index: number) {
    const currentImages = this.getCurrentImages()
    const newImages = [...currentImages]
    newImages[index] = src
    this.setImages(newImages)
  }

  private detachImage(index: number) {
    const currentImages = this.getCurrentImages()
    const newImages = [...currentImages]
    newImages[index] = ''
    this.setImages(newImages)
  }

  private getCurrentImages(): string[] {
    const src = this.node.attrs.src || ''
    return Array.isArray(src) ? src : [src]
  }

  private setImages(images: string[]) {
    const src = images.length === 1 ? images[0] : images
    const { tr } = this.view.state
    const pos = this.getPos()
    tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      src,
    })
    tr.setSelection(NodeSelection.create(tr.doc, pos))
    this.view.dispatch(tr)
  }

  protected createImg = (src: string) => {
    const img = document.createElement('img')
    img.classList.add('figure-image')
    img.src = src
    return img
  }

  protected createPlaceholder = (index: number) => {
    const element = document.createElement('div')
    element.classList.add('figure', 'placeholder')
    element.dataset.index = index.toString()

    const instructions = document.createElement('div')
    instructions.classList.add('instructions')
    instructions.innerHTML = `
      <p>Drag or click here to upload image <br>
      or drag items here from the file inspector tabs <br>
      <a data-action='open-other-files'>'Other files'</a> | 
      <a data-action='open-supplement-files'>'Supplements'</a></p>
    `

    const can = this.props.getCapabilities()
    if (can.uploadFile && !isDeleted(this.node)) {
      const handlePlaceholderClick = (event: Event) => {
        const target = event.target as HTMLElement
        if (target.dataset?.action) {
          return
        }
        const triggerUpload = figureUploader((file: File) =>
          this.upload(file, index)
        )
        triggerUpload()
      }

      element.addEventListener('click', handlePlaceholderClick)

      element.addEventListener('dragenter', (event) => {
        event.preventDefault()
        event.stopPropagation()
        element.classList.add('drag-over')
      })

      element.addEventListener('dragover', (event) => {
        event.preventDefault()
        event.stopPropagation()
        element.classList.add('drag-over')
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'copy'
        }
      })

      element.addEventListener('dragleave', (event) => {
        event.preventDefault()
        event.stopPropagation()
        element.classList.remove('drag-over')
      })

      element.addEventListener('drop', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        element.classList.remove('drag-over')

        if (event.dataTransfer?.files?.length) {
          const originalContent = instructions.innerHTML
          instructions.innerHTML = '<p>Uploading image...</p>'
          
          try {
            await this.upload(event.dataTransfer.files[0], index)
          } catch (error) {
            console.error('Upload failed:', error)
            instructions.innerHTML = originalContent
          }
        }
      })

      element.addEventListener('mouseenter', () => {
        element.classList.add('over')
      })

      element.addEventListener('mouseleave', () => {
        element.classList.remove('over')
      })
    }

    element.appendChild(instructions)
    return element
  }

  protected createUnsupportedFormat = (file: FileAttachment, index: number) => {
    const element = document.createElement('div')
    element.classList.add('figure', 'placeholder')
    element.dataset.fileId = file.id
    element.dataset.index = index.toString()

    const instructions = document.createElement('div')
    instructions.classList.add('instructions')

    const iconHtml = renderToStaticMarkup(
      createElement(FileCorruptedIcon, { className: 'icon' })
    )

    instructions.innerHTML = `
    <div>
      <div class="unsupported-icon-wrapper">${iconHtml}</div>
      <div>${file.name}</div>
      <div class="unsupported-format-label">
        Unsupported file format
      </div>
      <div>
        ${
          this.props.getCapabilities()?.editArticle
            ? 'Click to replace with supported image'
            : 'Unsupported file format'
        }
      </div>
    </div>
  `

    const can = this.props.getCapabilities()
    if (can.uploadFile && !isDeleted(this.node)) {
      element.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        if (target.dataset?.action) {
          return
        }

        const triggerUpload = figureUploader((newFile: File) => {
          this.detachImage(index)
          return this.upload(newFile, index)
        })
        triggerUpload()
      })

      element.addEventListener('mouseenter', () => {
        element.classList.add('over')
      })

      element.addEventListener('mouseleave', () => {
        element.classList.remove('over')
      })
    }

    element.appendChild(instructions)
    return element
  }

  protected addTools() {
    this.container.appendChild(this.createPositionMenuWrapper())
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