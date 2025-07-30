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
import { EmbedNode } from '@manuscripts/transform'
import { isEqual } from 'lodash'
import { NodeSelection } from 'prosemirror-state'

import {
  NoPreviewMessageWithLink,
  openEmbedDialog,
} from '../components/toolbar/InsertEmbedDialog'
import {
  addInteractionHandlers,
  createFileHandlers,
  createFileUploader,
  createMediaPlaceholder,
  createReactTools,
  createUnsupportedFormat,
  FileHandlers,
  getMediaTypeInfo,
} from '../lib/media'
import { getOEmbedHTML } from '../lib/oembed'
import { allowedHref } from '../lib/url'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createEditableNodeView } from './creators'
import { EditableBlock } from './editable_block'
import ReactSubView from './ReactSubView'

export class EmbedView extends BlockView<Trackable<EmbedNode>> {
  private container: HTMLElement
  private figureBlock: HTMLElement
  private preview: HTMLElement | null = null
  public reactTools: HTMLDivElement | null = null
  public ignoreMutation = () => true
  private initialized = false
  private previousAttrs: {
    href?: string
    mimetype?: string
    mimeSubtype?: string
  } = {}

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block')
    this.dom.appendChild(this.container)
    const figureBlock = document.createElement('div')
    figureBlock.classList.add('figure-block')
    this.container.appendChild(figureBlock)

    this.contentDOM = document.createElement('div')
    figureBlock.appendChild(this.contentDOM)

    this.figureBlock = figureBlock
  }

  upload = async (file: File) => {
    const mediaInfo = getMediaTypeInfo(file.name)

    const result = await this.props.fileManagement.upload(file)

    const pos = this.getPos()
    const tr = this.view.state.tr
    tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      href: result.id,
      mimetype: mediaInfo.mimetype,
      mimeSubtype: mediaInfo.mimeSubtype,
    })

    this.view.dispatch(tr)
  }

  public updateContents() {
    super.updateContents()
    const { href, mimetype, mimeSubtype } = this.node.attrs

    const currentAttrs = { href, mimetype, mimeSubtype }
    const contentChanged =
      !this.initialized || !isEqual(this.previousAttrs, currentAttrs)

    if (contentChanged) {
      this.initialized = true
      this.previousAttrs = currentAttrs
      this.updateMediaPreview()
      this.manageReactTools()
    }
  }

  private manageReactTools() {
    this.reactTools?.remove()

    let handlers: FileHandlers | undefined
    const can = this.props.getCapabilities()

    if (this.isUploadedFile()) {
      handlers = createFileHandlers(
        this.node,
        this.view,
        this.getPos,
        this.props,
        this.setHref
      )
      if (can.uploadFile) {
        handlers.handleUpload = createFileUploader(
          this.upload,
          'video/*,audio/*'
        )
      }
    } else if (this.isEmbedLink()) {
      handlers = this.createEmbedHandlers()
    }

    if (handlers) {
      this.reactTools = createReactTools(
        this.node,
        this.view,
        this.getPos,
        this.props,
        handlers,
        true,
        () => false
      )
      if (this.reactTools) {
        if (this.preview) {
          this.preview.insertBefore(this.reactTools, this.preview.firstChild)
        } else {
          this.dom.insertBefore(this.reactTools, this.dom.firstChild)
        }
      }
    }
  }

  protected setHref = (href: string) => {
    const { tr } = this.view.state
    const pos = this.getPos()
    tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      href: href,
    })
    tr.setSelection(NodeSelection.create(tr.doc, pos))
    this.view.dispatch(tr)
  }

  private isUploadedFile(): boolean {
    const { href } = this.node.attrs
    if (!href) {
      return false
    }

    const files = this.props.getFiles()
    return files.some((file) => file.id === href)
  }

  private isEmbedLink(): boolean {
    const { href } = this.node.attrs
    return !!(href && allowedHref(href) && !this.isUploadedFile())
  }

  private async updateMediaPreview() {
    const preview = document.createElement('div')
    preview.classList.add('media-preview')
    preview.setAttribute('contenteditable', 'false')

    const oldPreview = this.preview
      ? this.preview
      : this.figureBlock.querySelector('.media-preview')
    if (oldPreview) {
      this.figureBlock.replaceChild(preview, oldPreview)
    } else {
      this.figureBlock.prepend(preview)
    }
    this.preview = preview

    const href = this.node.attrs.href

    let object: HTMLElement

    if (!href) {
      object = createMediaPlaceholder('media', this.view, this.getPos)
    } else if (this.isUploadedFile()) {
      const files = this.props.getFiles()
      const file = files.find((f) => f.id === href)

      if (file) {
        const isValidMediaFile =
          getMediaTypeInfo(file.name).isAudio ||
          getMediaTypeInfo(file.name).isVideo
        object = isValidMediaFile
          ? this.createMedia() ||
            createUnsupportedFormat(
              file.name,
              this.props.getCapabilities().editArticle
            )
          : createUnsupportedFormat(
              file.name,
              this.props.getCapabilities().editArticle
            )
      } else {
        object = createMediaPlaceholder('media', this.view, this.getPos)
      }
    } else if (this.isEmbedLink()) {
      object = await this.createEmbedPreview()
    } else {
      object = createMediaPlaceholder('media', this.view, this.getPos)
    }

    const can = this.props.getCapabilities()
    if (can.uploadFile && object.classList.contains('placeholder')) {
      addInteractionHandlers(object, this.upload, 'video/*,audio/*')
    }

    preview.appendChild(object)
  }

  private createEmbedHandlers(): FileHandlers {
    const handlers: FileHandlers = {}

    handlers.handleReplaceEmbed = () => {
      openEmbedDialog(this.view, this.getPos())
    }

    return handlers
  }

  private async createEmbedPreview(): Promise<HTMLElement> {
    const container = document.createElement('div')
    container.classList.add('embed-preview')

    try {
      const html = await getOEmbedHTML(this.node.attrs.href, 643, 363)
      if (html) {
        container.innerHTML = html
      } else {
        this.showUnavailableMessage(container)
      }
    } catch (error) {
      this.showUnavailableMessage(container)
    }

    return container
  }

  private showUnavailableMessage(container: HTMLElement) {
    container.appendChild(
      ReactSubView(
        this.props,
        NoPreviewMessageWithLink,
        { href: this.node.attrs.href },
        this.node,
        this.getPos,
        this.view
      )
    )
  }

  public createMedia = () => {
    const { href } = this.node.attrs
    if (!href) {
      return null
    }

    const files = this.props.getFiles()
    const file = files.find((f) => f.id === href)
    if (!file) {
      return null
    }

    const mediaUrl = file.link || file.id

    if (!mediaUrl) {
      return null
    }

    const mediaInfo = getMediaTypeInfo(file.name)

    if (mediaInfo.isVideo) {
      const video = document.createElement('video')
      video.controls = true
      video.style.maxWidth = '100%'
      video.style.height = '250px'

      const source = document.createElement('source')
      source.src = mediaUrl

      video.appendChild(source)
      video.appendChild(
        document.createTextNode('Your browser does not support the video tag.')
      )

      return video
    } else if (mediaInfo.isAudio) {
      const audio = document.createElement('audio')
      audio.controls = true
      audio.style.width = '100%'

      const source = document.createElement('source')
      source.src = mediaUrl

      audio.appendChild(source)
      audio.appendChild(
        document.createTextNode('Your browser does not support the audio tag.')
      )

      return audio
    } else {
      return createUnsupportedFormat(
        file.name,
        this.props.getCapabilities().editArticle
      )
    }
  }
}

export default createEditableNodeView(EditableBlock(EmbedView))
