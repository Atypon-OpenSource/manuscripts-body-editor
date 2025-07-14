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
import { EmbedNode, schema } from '@manuscripts/transform'
import { isEqual } from 'lodash'
import { NodeSelection } from 'prosemirror-state'

import {
  addInteractionHandlers,
  createFileHandlers,
  createFileUploader,
  createMediaPlaceholder,
  createPositionMenuWrapper,
  createReactTools,
  createUnsupportedFormat,
  getMediaTypeInfo,
  setElementPositionAlignment,
  showPositionMenu,
} from '../lib/media'
import { isUploadedMedia } from '../lib/view'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createEditableNodeView } from './creators'
import { EditableBlock } from './editable_block'

export class MediaView extends BlockView<Trackable<EmbedNode>> {
  private container: HTMLElement
  public reactTools: HTMLDivElement | null = null
  positionMenuWrapper: HTMLDivElement
  mediaPosition: string
  public ignoreMutation = () => true
  private initialized = false
  private previousAttrs: {
    href?: string
    mimetype?: string
    mimeSubtype?: string
  } = {}

  public createDOM(): void {
    super.createDOM()
    if (isUploadedMedia(this.node, this.props)) {
      this.dom.classList.remove('block-embed')
      this.dom.classList.add('block-media')
    }
  }

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block', 'figure-block')
    this.dom.appendChild(this.container)

    this.contentDOM = document.createElement('div')
    this.container.appendChild(this.contentDOM)
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
    const { href, mimetype, mimeSubtype, type } = this.node.attrs

    const currentAttrs = { href, mimetype, mimeSubtype }
    const positionChanged = this.mediaPosition !== type
    const contentChanged =
      !this.initialized || !isEqual(this.previousAttrs, currentAttrs)
    if (positionChanged) {
      this.mediaPosition = type || 'default'
      setElementPositionAlignment(this.container, this.mediaPosition)
    }

    if (contentChanged) {
      this.initialized = true
      this.previousAttrs = currentAttrs
      this.updateMediaPreview()
      this.manageReactTools()
    }
  }

  private manageReactTools() {
    this.reactTools?.remove()

    const handlers = createFileHandlers(
      this.node,
      this.view,
      this.getPos,
      this.props,
      this.setHref
    )

    const can = this.props.getCapabilities()
    if (can.uploadFile) {
      handlers.handleUpload = createFileUploader(this.upload, 'video/*,audio/*')
    }

    this.reactTools = createReactTools(
      this.node,
      this.view,
      this.getPos,
      this.props,
      handlers
    )

    if (this.reactTools) {
      const preview = this.container.querySelector('.media-preview')
      if (preview) {
        preview.insertBefore(this.reactTools, preview.firstChild)
      } else {
        this.dom.insertBefore(this.reactTools, this.dom.firstChild)
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

  private updateMediaPreview() {
    const preview = document.createElement('div')
    preview.classList.add('media-preview')
    preview.setAttribute('contenteditable', 'false')

    const oldPreview = this.container.querySelector('.media-preview')
    if (oldPreview) {
      this.container.replaceChild(preview, oldPreview)
    } else {
      this.container.prepend(preview)
    }

    const href = this.node.attrs.href
    const files = this.props.getFiles()
    const file = href && files.find((f) => f.id === href)

    const isValidMediaFile = file && getMediaTypeInfo(file.name).isSupported

    const object = !href
      ? createMediaPlaceholder('media')
      : file
      ? isValidMediaFile
        ? this.createMedia() ||
          createUnsupportedFormat(
            file.name,
            this.props.getCapabilities().editArticle
          )
        : createUnsupportedFormat(
            file.name,
            this.props.getCapabilities().editArticle
          )
      : createMediaPlaceholder('media')

    const can = this.props.getCapabilities()
    if (can.uploadFile) {
      addInteractionHandlers(object, this.upload, 'video/*,audio/*')
    }

    preview.appendChild(object)
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

    let mediaUrl: string | undefined
    if (file.id) {
      mediaUrl = file.id
    }

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

  public actionGutterButtons = (): HTMLElement[] => {
    return [this.createPositionMenuWrapper()]
  }

  createPositionMenuWrapper = () => {
    this.positionMenuWrapper = createPositionMenuWrapper(
      this.mediaPosition,
      this.showPositionMenu,
      this.props
    )
    return this.positionMenuWrapper
  }

  showPositionMenu = () => {
    showPositionMenu(
      schema.nodes.embed,
      this.node,
      this.mediaPosition,
      this.positionMenuWrapper,
      this.view,
      this.getPos,
      this.props
    )
  }
}

export default createEditableNodeView(EditableBlock(MediaView))
