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

import { Figure } from '@manuscripts/json-schema'
import { ModelAttachment } from '@manuscripts/transform'
import prettyBytes from 'pretty-bytes'

import { createEditableNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import { FigureView } from './figure'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB

export class FigureEditableView extends FigureView<EditableBlockProps> {
  public updateContents = () => {
    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.firstChild as Node)
    }

    const media = this.createMedia()

    if (media) {
      this.container.appendChild(media)
    } else {
      const img = this.createFigureImage() || this.createFigurePlaceholder()

      if (this.props.getCapabilities().editArticle) {
        const input = document.createElement('input')
        input.accept = 'image/*'
        input.type = 'file'
        input.addEventListener('change', async (event) => {
          const target = event.target as HTMLInputElement

          if (target.files && target.files.length) {
            await this.updateFigure(target.files[0])
          }
        })

        img.addEventListener('click', () => {
          input.click()
        })

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

        img.addEventListener('dragover', (event) => {
          if (event.dataTransfer && event.dataTransfer.items) {
            for (const item of event.dataTransfer.items) {
              if (item.kind === 'file' && item.type.startsWith('image/')) {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'copy'
              }
            }
          }
        })

        img.addEventListener('drop', (event) => {
          if (event.dataTransfer && event.dataTransfer.files) {
            event.preventDefault()

            this.updateFigure(event.dataTransfer.files[0]).catch((error) => {
              console.error(error) // tslint:disable-line:no-console
            })
          }
        })
      }

      this.container.appendChild(img)
    }
  }

  public createFigurePlaceholder = () => {
    const element = document.createElement('div')
    element.classList.add('figure')
    element.classList.add('placeholder')

    const instructions = document.createElement('div')
    instructions.textContent = 'Click to select an image file'
    instructions.style.pointerEvents = 'none' // avoid interfering with dragleave event
    element.appendChild(instructions)

    return element
  }

  public updateFigure = async (file: File) => {
    const { id } = this.node.attrs

    if (file.size > MAX_IMAGE_SIZE) {
      alert(`The figure image size limit is ${prettyBytes(MAX_IMAGE_SIZE)}`)
      return
    }

    const contentType = file.type
    const src = window.URL.createObjectURL(file)

    const model = this.props.getModel<Figure>(id)

    if (model) {
      await this.props.saveModel<Figure & ModelAttachment>({
        ...model,
        contentType,
        src,
        attachment: {
          id: 'image',
          type: contentType,
          data: file,
        },
      })
    }

    const { selection, tr } = this.view.state

    tr.setNodeMarkup(this.getPos(), undefined, {
      ...this.node.attrs,
      src,
      contentType,
    }).setSelection(selection.map(tr.doc, tr.mapping))

    this.view.dispatch(tr)
  }
}

export default createEditableNodeView(FigureEditableView)
