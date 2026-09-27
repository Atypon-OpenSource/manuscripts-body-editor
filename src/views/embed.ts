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
import { AddCircleIcon } from '@manuscripts/style-guide'
import { Button } from '@manuscripts/style-guide/mui'
import { EmbedNode, ExtLink } from '@manuscripts/transform'
import isEqual from 'lodash/isEqual'
import { NodeSelection } from 'prosemirror-state'
import React from 'react'

import {
  NoPreviewMessageWithLink,
  openEmbedDialog,
} from '../components/toolbar/InsertEmbedDialog'
import {
  addCaptionLink,
  CaptionFileItem,
  captionFileAccept,
  captionLinkType,
  createCaptionFileList,
  createCaptionFilePlaceholder,
  createUnsupportedCaptionFile,
  isCaptionFile,
  removeCaptionLink,
  setCaptionLinkLanguage,
} from '../lib/captions'
import { getMediaTypeInfo } from '../lib/get-media-type'
import {
  addInteractionHandlers,
  createFileHandlers,
  createFileUploader,
  createMediaPlaceholder,
  createReactTools,
  createUnsupportedFormat,
  FileHandlers,
  MediaType,
} from '../lib/media'
import { allowedHref } from '../lib/url'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createEditableNodeView } from './creators'
import { EditableBlock } from './editable_block'
import ReactSubView from './ReactSubView'

export class EmbedView extends BlockView<Trackable<EmbedNode>> {
  private container: HTMLElement
  private figureBlock: HTMLElement
  private captionFileContainer: HTMLElement
  private preview: HTMLElement | null = null
  public reactTools: HTMLDivElement | null = null
  public ignoreMutation = () => true
  private initialized = false
  private previousAttrs: {
    href?: string
    mimetype?: string
    mimeSubtype?: string
    extLinks?: ExtLink[]
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

    this.captionFileContainer = document.createElement('div')
    this.captionFileContainer.classList.add('add-caption-file-button')
    figureBlock.appendChild(this.captionFileContainer)

    this.figureBlock = figureBlock
  }

  private getCaptionFiles = (): CaptionFileItem[] => {
    const extLinks = (this.node.attrs.extLinks || []) as ExtLink[]
    const files = this.props.getFiles()

    return extLinks
      .filter((link) => link.type === captionLinkType)
      .map((link) => ({
        id: link.href,
        name:
          link.label ||
          files.find((file) => file.id === link.href)?.name ||
          link.href,
        language: link.lang || '',
      }))
  }

  private setExtLinks = (extLinks: ExtLink[]) => {
    const pos = this.getPos()
    const tr = this.view.state.tr
    tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      extLinks,
    })
    this.view.dispatch(tr)
  }

  private appendCaptionFiles = () => {
    const captionFiles = this.getCaptionFiles()
    if (!captionFiles.length) {
      return
    }
    this.captionFileContainer.appendChild(
      createCaptionFileList(
        captionFiles,
        this.props.languages || [],
        this.updateCaptionFileLanguage,
        this.deleteCaptionFile,
        this.showCaptionLanguageMenu
      )
    )
  }

  private renderCaptionFileSection = (extra?: HTMLElement) => {
    this.captionFileContainer.innerHTML = ''
    this.appendCaptionFiles()
    this.captionFileContainer.appendChild(
      extra || this.createAddCaptionFileButton()
    )
  }

  private createAddCaptionFileButton = () =>
    ReactSubView(
      this.props,
      () =>
        React.createElement(
          Button,
          {
            variant: 'tertiary',
            startIcon: React.createElement(AddCircleIcon),
            onClick: this.renderCaptionFilePlaceholder,
          },
          'Add caption file'
        ),
      {},
      this.node,
      this.getPos,
      this.view,
      ['add-caption-file-inner']
    )

  private renderCaptionFilePlaceholder = () => {
    const placeholder = createCaptionFilePlaceholder(() =>
      this.renderCaptionFileSection()
    )
    addInteractionHandlers(
      placeholder,
      this.uploadCaptionFile,
      captionFileAccept
    )
    this.renderCaptionFileSection(placeholder)
  }

  private uploadCaptionFile = async (file: File) => {
    if (!isCaptionFile(file)) {
      this.renderUnsupportedCaptionFile(file.name)
      return
    }

    const result = await this.props.fileManagement.upload(file)
    this.setExtLinks(
      addCaptionLink(this.node.attrs.extLinks, {
        id: result.id,
        name: file.name,
      })
    )
  }

  private showCaptionLanguageMenu = (
    anchor: HTMLElement,
    menu: HTMLElement
  ) => {
    this.props.popper.destroy()
    this.props.popper.show(anchor, menu, 'bottom-end', false)
    return () => this.props.popper.destroy()
  }

  private updateCaptionFileLanguage = (id: string, language: string) => {
    this.setExtLinks(
      setCaptionLinkLanguage(this.node.attrs.extLinks, id, language)
    )
  }

  private deleteCaptionFile = (id: string) => {
    this.setExtLinks(removeCaptionLink(this.node.attrs.extLinks, id))
  }

  private renderUnsupportedCaptionFile = (filename: string) => {
    const placeholder = createUnsupportedCaptionFile(filename, () =>
      this.renderCaptionFileSection()
    )
    addInteractionHandlers(
      placeholder,
      this.uploadCaptionFile,
      captionFileAccept
    )
    this.renderCaptionFileSection(placeholder)
  }

  upload = async (file: File) => {
    const mediaInfo = getMediaTypeInfo(file)

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
    const { href, mimetype, mimeSubtype, extLinks } = this.node.attrs

    const currentAttrs = { href, mimetype, mimeSubtype, extLinks }
    const contentChanged =
      !this.initialized || !isEqual(this.previousAttrs, currentAttrs)
    const mediaChanged =
      !this.initialized ||
      this.previousAttrs.href !== href ||
      this.previousAttrs.mimetype !== mimetype ||
      this.previousAttrs.mimeSubtype !== mimeSubtype
    const captionsChanged = !isEqual(this.previousAttrs.extLinks, extLinks)

    if (contentChanged) {
      this.initialized = true
      this.previousAttrs = currentAttrs
      if (captionsChanged) {
        this.renderCaptionFileSection()
      }
      if (mediaChanged) {
        this.updateMediaPreview()
        this.manageReactTools()
      }
    }
  }

  private manageReactTools() {
    this.reactTools?.remove()

    let handlers: FileHandlers | undefined
    const can = this.props.getCapabilities()

    if (this.isUploadedFile()) {
      handlers = createFileHandlers(
        this.node.attrs,
        'href',
        this.view,
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
      object = createMediaPlaceholder(
        MediaType.Media,
        this.view,
        this.getPos,
        this.props
      )
    } else if (this.isUploadedFile()) {
      const files = this.props.getFiles()
      const file = files.find((f) => f.id === href)

      if (file) {
        const mediaInfo = getMediaTypeInfo(file.name)
        const isValidMediaFile = mediaInfo.isAudio || mediaInfo.isVideo
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
        object = createMediaPlaceholder(
          MediaType.Media,
          this.view,
          this.getPos,
          this.props
        )
      }
    } else if (this.isEmbedLink()) {
      object = await this.createEmbedPreview()
    } else {
      object = createMediaPlaceholder(
        MediaType.Media,
        this.view,
        this.getPos,
        this.props
      )
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
      const html = await this.props.fetchOEmbedHtml(
        this.node.attrs.href,
        643,
        363
      )
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
