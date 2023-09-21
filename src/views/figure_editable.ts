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

import { Model } from '@manuscripts/json-schema'
import {
  Capabilities,
  FileAttachment,
  FileManagement,
} from '@manuscripts/style-guide'
import { ManuscriptEditorView, ManuscriptNode } from '@manuscripts/transform'

import {
  FigureOptions,
  FigureOptionsProps,
} from '../components/views/FigureDropdown'
import { createEditableNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import { FigureView } from './figure'
import ReactSubView from './ReactSubView'

const FORMAT_PARAM = 'format=jpg'

export interface FigureProps {
  fileManagement: FileManagement
  getFiles: () => FileAttachment[]
  getModelMap: () => Map<string, Model>
  getCapabilities: () => Capabilities
  isInGraphicalAbstract?: boolean
}

export class FigureEditableView extends FigureView<
  EditableBlockProps & FigureProps
> {
  public reactTools: HTMLDivElement

  public viewProps: {
    node: ManuscriptNode
    getPos: () => number
    view: ManuscriptEditorView
  }

  public initialise = () => {
    this.viewProps = {
      node: this.node,
      getPos: this.getPos,
      view: this.view,
    }

    this.createDOM()
    this.updateContents()
  }

  public updateContents = () => {
    let attrs = this.node.attrs

    if (this.node.attrs.dataTracked?.length) {
      /*
        if track-status is 'rejected' and operation is 'set_attrs' then find old attribute in
        the this.node.attrs.dataTracked[x].oldAttrs and use them in the display
      */

      if (
        this.node.attrs.dataTracked[0].status === 'rejected' &&
        this.node.attrs.dataTracked[0].operation === 'set_attrs'
      ) {
        attrs = this.node.attrs.dataTracked[0].oldAttrs
      }

      this.dom.setAttribute(
        'data-track-status',
        this.node.attrs.dataTracked[0].status
      )
      this.dom.setAttribute(
        'data-track-op',
        this.node.attrs.dataTracked[0].operation
      )
    } else {
      this.dom.removeAttribute('data-track-status')
      this.dom.removeAttribute('data-track-type')
    }

    const src = attrs.src
    const files = this.props.getFiles()
    const file = files.filter((f) => f.id === src)[0]

    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.firstChild as Node)
    }

    const capabilities = this.props.getCapabilities()

    const img =
      file && file.link ? this.createImg(file.link) : this.createPlaceholder()

    const handleDownload = () => {
      this.props.fileManagement.download(file)
    }

    let handleUpload = () => {
      //
    }

    const handleReplace = (file: FileAttachment) => {
      this.setSrc(file.id)
    }

    const handleDetach = () => {
      this.setSrc('')
    }

    if (capabilities.uploadFile) {
      const upload = async (file: File) => {
        const result = await this.props.fileManagement.upload(file)
        this.setSrc(result.id)
      }

      const handleFileChange = async (e: Event) => {
        const target = e.target as HTMLInputElement
        if (target && target.files && target.files.length) {
          await upload(target.files[0])
        }
      }

      const input = document.createElement('input')
      input.accept = 'image/*'
      input.type = 'file'
      input.addEventListener('change', handleFileChange)

      handleUpload = () => input.click()

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
        if (e.dataTransfer && e.dataTransfer.files) {
          e.preventDefault()
          await upload(e.dataTransfer.files[0])
        }
      })
    }

    this.container.innerHTML = ''
    this.container.appendChild(img)

    if (this.props.dispatch && this.props.theme) {
      const componentProps: FigureOptionsProps = {
        can: capabilities,
        files,
        modelMap: this.props.getModelMap(),
        handleDownload,
        handleUpload,
        handleDetach,
        handleReplace,
      }
      this.reactTools?.remove()
      this.reactTools = ReactSubView(
        this.props,
        FigureOptions,
        componentProps,
        this.node,
        this.getPos,
        this.view
      )
    }
    if (this.reactTools) {
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

  private createImg = (src: string) => {
    const separator = src.includes('?') ? '&' : '?'
    src += separator + FORMAT_PARAM
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
