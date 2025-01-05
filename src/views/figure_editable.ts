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

import { FileCorruptedIcon } from '@manuscripts/style-guide'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  FigureOptions,
  FigureOptionsProps,
} from '../components/views/FigureDropdown'
import { FileAttachment, groupFiles } from '../lib/files'
import { createEditableNodeView } from './creators'
import { FigureView } from './figure'
import { figureUploader } from './figure_uploader'
import ReactSubView from './ReactSubView'

export class FigureEditableView extends FigureView {
  public reactTools: HTMLDivElement

  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public updateContents() {
    super.updateContents()
    const attrs = this.node.attrs

    const src = attrs.src
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

    let handleDownload
    let handleUpload
    let handleReplace
    let handleDetach

    if (src) {
      if (file) {
        handleDownload = () => {
          this.props.fileManagement.download(file)
        }
      }

      handleReplace = (file: FileAttachment) => {
        this.setSrc(file.id)
      }

      handleDetach = () => {
        this.setSrc('')
      }
    }

    if (can.uploadFile) {
      const upload = async (file: File) => {
        const result = await this.props.fileManagement.upload(file)
        this.setSrc(result.id)
      }

      handleUpload = figureUploader(upload)

      img.addEventListener('click', handleUpload)

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
          await upload(e.dataTransfer.files[0])
        }
      })
    }

    this.container.innerHTML = ''
    this.container.appendChild(img)

    this.reactTools?.remove()
    if (this.props.dispatch && this.props.theme) {
      const files = this.props.getFiles()
      const doc = this.view.state.doc
      const componentProps: FigureOptionsProps = {
        can,
        files: groupFiles(doc, files),
        onDownload: handleDownload,
        onUpload: handleUpload,
        onDetach: handleDetach,
        onReplace: handleReplace,
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

  private setSrc = (src: string) => {
    const { selection, tr } = this.view.state

    tr.setNodeMarkup(this.getPos(), undefined, {
      ...this.node.attrs,
      src: src,
    }).setSelection(selection.map(tr.doc, tr.mapping))

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

  private createImg = (src: string) => {
    const img = document.createElement('img')
    img.classList.add('figure-image')
    img.src = src
    return img
  }

  private createPlaceholder = () => {
    const element = document.createElement('div')
    element.classList.add('figure', 'placeholder')

    const instructions = document.createElement('div')
    instructions.classList.add('instructions')
    instructions.textContent = 'Click to select an image file'

    instructions.style.pointerEvents = 'none' // avoid interfering with dragleave event
    element.appendChild(instructions)

    return element
  }
}

export default createEditableNodeView(FigureEditableView)
