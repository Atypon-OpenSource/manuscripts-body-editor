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
  SubmissionAttachment,
  UnsupportedFormatFileIcon,
} from '@manuscripts/style-guide'
import {
  isInGraphicalAbstractSection,
  ManuscriptEditorView,
  ManuscriptNode,
} from '@manuscripts/transform'
import prettyBytes from 'pretty-bytes'
import { createElement } from 'react'
import ReactDOM from 'react-dom'

import FigureOptionsSubview, {
  FigureOptionsSubviewProps,
} from '../components/views/FigureOptionsSubview'
import { createOnUploadHandler } from '../lib/figure-file-upload'
import { setNodeAttrs as setGivenNodeAttrs } from '../lib/utils'
import { createEditableNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import { FigureView } from './figure'
import { addFormatQuery } from './FigureComponent'
import ReactSubView from './ReactSubView'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB

interface FigureProps {
  getAttachments: () => SubmissionAttachment[]
  modelMap: Map<string, Model>
  submissionId: string
  uploadAttachment: (designation: string, file: File) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  updateDesignation: (designation: string, name: string) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  capabilities?: Capabilities
  isInGraphicalAbstract?: boolean
  mediaAlternativesEnabled?: boolean
}

export class FigureEditableView extends FigureView<
  EditableBlockProps & FigureProps
> {
  public reactTools: HTMLDivElement
  public envokeFileInput: () => void

  public viewProps: {
    node: ManuscriptNode
    getPos: () => number
    view: ManuscriptEditorView
  }
  public setFigureAttrs: (attrs: { [key: string]: unknown }) => void

  public initialise = () => {
    this.viewProps = {
      node: this.node,
      getPos: this.getPos,
      view: this.view,
    }

    this.setFigureAttrs = setGivenNodeAttrs(
      // try it out like that - having it initialised before update contents
      this.viewProps.node,
      this.viewProps,
      this.view.dispatch,
      this.viewProps.getPos()
    )

    this.createDOM()
    this.updateContents()
  }

  // TODO: load/subscribe to the figure style object from the database and use it here?
  protected createDOM = () => {
    this.dom = document.createElement('figure')
    this.dom.setAttribute('id', this.node.attrs.id)

    this.container = document.createElement('div')
    this.container.className = 'figure'
    this.container.contentEditable = 'false'
    this.dom.appendChild(this.container)

    this.contentDOM = document.createElement('div') // TODO: figcaption?
    this.contentDOM.className = 'figure-caption'
    this.contentDOM.setAttribute('tabindex', '1337') // allow focus in this node
    this.dom.appendChild(this.contentDOM)
  }

  public getFileData = () => {
    // When in PM doc we replace attachment id with a real uri. So the src like 'https://lw.com/image.jpg'

    const imageFileRegex =
      /[^\s]+(.*?)\.(jpg|jpeg|png|gif|svg|webp|tif|tiff)(\?format=jpg)?$/gi
    const src = this.node.attrs.src
    if (this.node.attrs.contentType && src) {
      return {
        isSupportedImageType: this.node.attrs.contentType.startsWith(
          'image/'
        ) as boolean,
        fileName: src,
        url: addFormatQuery(src) as string,
      }
    }

    return {
      isSupportedImageType: imageFileRegex.test(src),
      fileName: src,
      url: addFormatQuery(src),
    }
  }

  private getAttachment = (src: string) => {
    return this.props.getAttachments().find((a) => src.startsWith(a.link))
  }

  public createImage = (isSupportedImageType: boolean, src?: string) => {
    if (src && isSupportedImageType) {
      const element = document.createElement('img')
      element.classList.add('figure-image')
      element.src = src
      return element
    }
  }

  addAttachmentSrc = (link: string) => {
    if (this.node) {
      this.setFigureAttrs({
        src: link,
      })
    }
  }

  private isInGraphicalAbstract = () => {
    const resolvedPos = this.view.state.doc.resolve(this.getPos())
    return isInGraphicalAbstractSection(resolvedPos)
  }

  private detachImageRef = () => {
    if (this.node) {
      const ref = this.getAttachment(this.node.attrs.src)

      if (ref) {
        this.setFigureAttrs({
          src: '',
        })
      }
    }
  }

  public updateContents = () => {
    const { isSupportedImageType, fileName, url } = this.getFileData()

    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.firstChild as Node)
    }

    const media = this.createMedia()

    if (media) {
      this.container.appendChild(media)
    } else {
      const img =
        this.createImage(isSupportedImageType, url) ||
        this.createPlaceholder(isSupportedImageType, fileName)

      if (this.props.capabilities?.editArticle) {
        const uploadAttachmentHandler = createOnUploadHandler(
          this.props.uploadAttachment,
          this.isInGraphicalAbstract() ? 'graphical-abstract-image' : 'figure',
          this.addAttachmentSrc
        )
        const input = document.createElement('input')
        input.accept = 'image/*'
        input.type = 'file'
        input.addEventListener('change', uploadAttachmentHandler)

        this.envokeFileInput = () => {
          input.click()
        }

        img.addEventListener('click', this.envokeFileInput)

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

      this.container.innerHTML = ''
      this.container.appendChild(img)

      if (this.props.dispatch && this.props.theme && this.props.capabilities) {
        const componentProps: FigureOptionsSubviewProps = {
          src: url,
          onUploadClick: this.envokeFileInput,
          getAttachments: this.props.getAttachments,
          modelMap: this.props.modelMap,
          onDetachClick: this.detachImageRef,
          mediaAlternativesEnabled: !!this.props.mediaAlternativesEnabled,
          setFigureAttrs: this.setFigureAttrs,
          can: this.props.capabilities,
          submissionId: this.props.submissionId,
        }

        this.reactTools = ReactSubView(
          this.props,
          FigureOptionsSubview,
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
  }

  public createPlaceholder = (
    isSupportedImageType: boolean,
    fileName: string
  ) => {
    const element = document.createElement('div')
    element.classList.add('figure')
    element.classList.add('placeholder')

    const instructions = document.createElement('div')

    if (!isSupportedImageType && fileName) {
      const iconContainer = document.createElement('div')
      ReactDOM.render(
        createElement(UnsupportedFormatFileIcon, { className: 'icon' }),
        iconContainer,
        () => {
          const target = instructions.querySelector('.unsupported-icon-wrapper')
          if (target) {
            target.innerHTML = iconContainer.innerHTML
          }
        }
      )

      instructions.innerHTML = `
        <div>
          <div class="unsupported-icon-wrapper"></div>
          <div>${fileName}</div>
          <div class="unsupported-format-label">
            Unsupported file format
          </div>
          <div>
            ${
              this.props.capabilities?.editArticle
                ? 'Click to add image'
                : 'No image here yet…'
            }
          </div>
        </div>
      `
    } else {
      instructions.textContent = 'Click to select an image file'
    }
    instructions.style.pointerEvents = 'none' // avoid interfering with dragleave event
    element.appendChild(instructions)

    return element
  }

  public updateFigure = async (file: File) => {
    // const { id } = this.node.attrs

    if (file.size > MAX_IMAGE_SIZE) {
      alert(`The figure image size limit is ${prettyBytes(MAX_IMAGE_SIZE)}`)
      return
    }

    const contentType = file.type
    const src = window.URL.createObjectURL(file)

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
