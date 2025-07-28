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
  ManuscriptEditorView,
  ManuscriptNode,
  schema,
  SupplementNode,
} from '@manuscripts/transform'

import { openEmbedDialog } from '../components/toolbar/InsertEmbedDialog'
import {
  FigureOptions,
  FigureOptionsProps,
} from '../components/views/FigureDropdown'
import { EditorProps } from '../configs/ManuscriptsEditor'
import { fileCorruptedIcon } from '../icons'
import { Trackable } from '../types'
import ReactSubView from '../views/ReactSubView'
import { FileAttachment } from './files'

export interface MediaTypeInfo {
  extension: string
  isVideo: boolean
  isAudio: boolean
  isImage: boolean
  isSupported: boolean
  mimetype?: string
  mimeSubtype?: string
}

export const getMediaTypeInfo = (filename: string): MediaTypeInfo => {
  const extension = filename.toLowerCase().split('.').pop() || ''

  const videoExtensions = [
    'mp4',
    'webm',
    'avi',
    'mov',
    'mkv',
    'flv',
    'wmv',
    'mpg',
    'mpeg',
  ]
  const audioExtensions = ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'wma']
  const imageExtensions = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'svg',
    'webp',
    'tiff',
    'tif',
  ]

  const isVideo = videoExtensions.includes(extension)
  const isAudio = audioExtensions.includes(extension)
  const isImage = imageExtensions.includes(extension)
  const isSupported = isVideo || isAudio || isImage

  let mimetype: string | undefined
  let mimeSubtype: string | undefined

  if (isVideo) {
    mimetype = 'video'
    mimeSubtype = extension === 'mov' ? 'quicktime' : extension
  } else if (isAudio) {
    mimetype = 'audio'
    mimeSubtype = extension === 'm4a' ? 'mp4' : extension
  } else if (isImage) {
    mimetype = 'image'
    mimeSubtype = extension === 'jpg' ? 'jpeg' : extension
  }

  return {
    extension,
    isVideo,
    isAudio,
    isImage,
    isSupported,
    mimetype,
    mimeSubtype,
  }
}

export const createUnsupportedFormat = (
  filename: string,
  canEdit: boolean
): HTMLElement => {
  const element = document.createElement('div')
  element.classList.add('figure', 'placeholder')

  const instructions = document.createElement('div')
  instructions.classList.add('instructions')

  const iconHtml = fileCorruptedIcon

  instructions.innerHTML = `
    <div>
      <div class="unsupported-icon-wrapper">${iconHtml}</div>
      <div>${filename}</div>
      <div class="unsupported-format-label">
        Unsupported file format
      </div>
      <div>
        ${canEdit ? 'Click to add media' : 'No media here yet…'}
      </div>
    </div>
  `

  element.appendChild(instructions)
  return element
}

export const createMediaPlaceholder = (
  mediaType: 'media' | 'figure' = 'media',
  view?: ManuscriptEditorView,
  getPos?: () => number
): HTMLElement => {
  const element = document.createElement('div')
  element.classList.add('figure', 'placeholder')

  const instructions = document.createElement('div')
  instructions.classList.add('instructions')

  const uploadText = mediaType === 'media' ? 'media' : 'image'

  instructions.innerHTML = `
    <div class="placeholder-content">
      <p>Drag or click here to upload ${uploadText} <br>
      or drag items here from the file inspector tabs <br>
      <a data-action='open-other-files'>'Other files'</a> |
      <a data-action='open-supplement-files'>'Supplements'</a>
      ${
        mediaType === 'media' && view && getPos
          ? "| <a data-action='add-external-link'>'External link'</a>"
          : ''
      }
      </p>
    </div>
  `

  if (mediaType === 'media' && view && getPos) {
    const embedLink = instructions.querySelector(
      "[data-action='add-external-link']"
    )
    if (embedLink) {
      embedLink.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        openEmbedDialog(view, getPos())
      })
    }
  }

  element.appendChild(instructions)
  return element
}

export interface FileHandlers {
  handleDownload?: () => void
  handleUpload?: () => void
  handleReplace?: (file: FileAttachment, isSupplement?: boolean) => void
  handleReplaceEmbed?: () => void
  handleDetach?: () => void
  handleDelete?: () => void
}

export const createFileHandlers = <T extends ManuscriptNode>(
  node: Trackable<T>,
  view: ManuscriptEditorView,
  getPos: () => number,
  props: EditorProps,
  setHref: (href: string) => void
): FileHandlers => {
  const handlers: FileHandlers = {}
  const href = node.attrs.href
  const files = props.getFiles()
  const file = href && files.find((f) => f.id === href)
  const can = props.getCapabilities()

  if (href && file) {
    handlers.handleDownload = () => {
      props.fileManagement.download(file)
    }
    handlers.handleDetach = () => {
      setHref('')
    }
  }

  if (can.replaceFile) {
    handlers.handleReplace = (file: FileAttachment, isSupplement = false) => {
      setHref(file.id)
      if (isSupplement) {
        const tr = view.state.tr
        view.state.doc.descendants((node, pos) => {
          if (node.type === schema.nodes.supplement) {
            const href = (node as SupplementNode).attrs.href
            if (href === file.id) {
              tr.delete(pos, pos + node.nodeSize)
              view.dispatch(tr)
            }
          }

          if (
            node.type !== schema.nodes.supplements &&
            node.type !== schema.nodes.manuscript
          ) {
            return false
          }
        })
      }
    }
  }

  return handlers
}

export const createReactTools = <T extends ManuscriptNode>(
  node: Trackable<T>,
  view: ManuscriptEditorView,
  getPos: () => number,
  props: EditorProps,
  handlers: FileHandlers,
  isEmbed: boolean,
  hasSiblings: () => boolean
): HTMLDivElement | null => {
  if (!props.dispatch || !props.theme) {
    return null
  }

  const can = props.getCapabilities()
  const componentProps: FigureOptionsProps = {
    can,
    getDoc: () => view.state.doc,
    getFiles: props.getFiles,
    onDownload: handlers.handleDownload,
    onUpload: handlers.handleUpload,
    onDetach: handlers.handleDetach,
    onReplace: handlers.handleReplace,
    onReplaceEmbed: handlers.handleReplaceEmbed,
    onDelete: handlers.handleDelete,
    isEmbed,
    hasSiblings,
  }

  return ReactSubView(props, FigureOptions, componentProps, node, getPos, view)
}

export const createFileUploader = (
  handler: (file: File) => Promise<void>,
  accept = '*/*'
) => {
  const handleFileChange = async (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target && target.files && target.files.length) {
      await handler(target.files[0])
    }
  }

  const input = document.createElement('input')
  input.accept = accept
  input.type = 'file'
  input.addEventListener('change', handleFileChange)

  return () => input.click()
}

export const addInteractionHandlers = (
  element: HTMLElement,
  uploadFn: (file: File) => Promise<void>,
  accept = '*/*'
): void => {
  const handlePlaceholderClick = (event: Event) => {
    const target = event.target as HTMLElement
    if (target.dataset && target.dataset.action) {
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.addEventListener('change', async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        await uploadFn(files[0])
      }
    })
    input.click()
  }

  element.addEventListener('click', handlePlaceholderClick)

  element.addEventListener('mouseenter', () => {
    element.classList.toggle('over', true)
  })

  element.addEventListener('mouseleave', () => {
    element.classList.toggle('over', false)
  })

  element.addEventListener('dragenter', (event) => {
    event.preventDefault()
    element.classList.toggle('over', true)
  })

  element.addEventListener('dragleave', (event) => {
    event.preventDefault()
    element.classList.toggle('over', false)
  })

  element.addEventListener('dragover', (e) => {
    const dragEvent = e as DragEvent
    if (dragEvent.dataTransfer && dragEvent.dataTransfer.items) {
      for (const item of dragEvent.dataTransfer.items) {
        if (item.kind === 'file') {
          e.preventDefault()
          dragEvent.dataTransfer.dropEffect = 'copy'
          break
        }
      }
    }
  })

  element.addEventListener('drop', async (e) => {
    if (e.dataTransfer && e.dataTransfer.files.length) {
      e.preventDefault()
      await uploadFn(e.dataTransfer.files[0])
    }
  })
}
