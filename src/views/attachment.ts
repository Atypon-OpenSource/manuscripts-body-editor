/*!
 * © 2025 Atypon Systems LLC
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

import { ManuscriptNode } from '@manuscripts/transform'

import { fileMainDocumentIcon } from '../icons'
import { FileAttachment } from '../lib/files'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'

// Extended file type that includes properties from the article editor
interface ExtendedFileAttachment extends FileAttachment {
  type?: string
}

const PDF_EXTENSION = '.pdf'
const PDF_MIME_TYPE = 'application/pdf'

export class AttachmentView extends BlockView<Trackable<ManuscriptNode>> {
  private container: HTMLElement

  public createElement = () => {
    this.createContainer()
    this.renderView()
  }

  public updateContents() {
    this.renderView()
  }

  private renderView() {
    this.container.innerHTML = ''
    this.container.classList.remove('attachment-hidden')

    const file = this.getFileFromAttachment()

    if (!file) {
      this.container.classList.add('attachment-hidden')
      return
    }

    const isPDF = this.isPDF(file)

    if (isPDF) {
      this.createPDFPreview(file)
    } else {
      this.container.classList.add('attachment-hidden')
    }
  }

  private createContainer() {
    this.container = document.createElement('div')
    this.container.classList.add('block', 'attachment-item')

    // Add click handler to focus on main document in inspector
    this.container.addEventListener('click', (e) => {
      e.stopPropagation()
      this.setMainDocumentSelection()
    })
    this.dom.appendChild(this.container)
  }

  private isPDF(file: ExtendedFileAttachment): boolean {
    const isPDFByExtension = file.name?.toLowerCase().endsWith(PDF_EXTENSION)
    const isPDFByMimeType = file.type === PDF_MIME_TYPE
    return isPDFByExtension || isPDFByMimeType
  }

  private getFileFromAttachment(): ExtendedFileAttachment | null {
    const { href } = this.node.attrs
    if (!href) {
      return null
    }

    const files = this.props?.getFiles?.() || []
    const foundFile = files.find((f: ExtendedFileAttachment) => f.id === href)
    return foundFile || null
  }

  private createPDFPreview(file: ExtendedFileAttachment) {
    this.container.setAttribute('data-pdf-preview', file.id)

    const header = this.createHeader(file)
    this.container.appendChild(header)

    const content = this.createContent(file)
    this.container.appendChild(content)
  }

  private createHeader(file: ExtendedFileAttachment): HTMLElement {
    const header = document.createElement('div')
    header.className = 'attachment-header'

    const icon = this.createIcon()
    const name = this.createFileName(file.name)

    header.appendChild(icon)
    header.appendChild(name)

    return header
  }

  private createIcon(): HTMLElement {
    const icon = document.createElement('span')
    icon.className = 'attachment-icon'
    icon.innerHTML = fileMainDocumentIcon
    return icon
  }

  private createFileName(fileName: string): HTMLElement {
    const name = document.createElement('span')
    name.textContent = fileName
    name.className = 'attachment-name'
    name.title = fileName

    return name
  }

  private createContent(file: ExtendedFileAttachment): HTMLElement {
    const content = document.createElement('div')
    content.className = 'attachment-content'

    const iframeContainer = document.createElement('div')
    iframeContainer.className = 'iframe-container'

    const iframe = document.createElement('iframe')
    iframe.className = 'attachment-iframe'
    iframe.src = this.getPDFUrl(file)
    iframe.title = `PDF Preview: ${file.name}`
    iframe.sandbox.add('allow-same-origin', 'allow-scripts')

    iframeContainer.appendChild(iframe)
    content.appendChild(iframeContainer)

    return content
  }

  private getPDFUrl(file: ExtendedFileAttachment): string {
    if (file.link && !file.link.includes('figure.png')) {
      return file.link
    }

    if (file.id && file.id.startsWith('attachment:')) {
      const uuid = file.id.replace('attachment:', '')
      return `/lw/attachment/${uuid}`
    }

    return '#'
  }

  /**
   * Dispatches event to focus on main document in inspector
   */
  private setMainDocumentSelection() {
    const event = new CustomEvent('selectMainDocument', {
      detail: {
        action: 'select-main-document',
      },
      bubbles: true,
    })
    this.dom.dispatchEvent(event)
  }
}

export default createNodeView(AttachmentView)
