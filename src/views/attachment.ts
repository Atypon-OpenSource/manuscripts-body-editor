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

import { AttachmentNode } from '@manuscripts/transform'

import { fileMainDocumentIcon } from '../icons'
import { FileAttachment } from '../lib/files'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'

// Extended file type that includes properties from the article editor
interface ExtendedFileAttachment extends FileAttachment {
  type?: string
}

export class AttachmentView extends BlockView<Trackable<AttachmentNode>> {
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

    const file = this.getFileFromAttachment()
    if (!file) {
      return
    }

    if (this.isPDF(file)) {
      this.createPDFPreview(file)
    }
  }

  private createContainer() {
    this.container = document.createElement('div')
    this.container.classList.add('attachment-item')
    this.container.addEventListener('click', (e) => {
      e.stopPropagation()
      this.setMainDocumentSelection()
    })
    this.dom.setAttribute('contentEditable', 'false')
    this.dom.appendChild(this.container)
  }

  private isPDF(file: ExtendedFileAttachment) {
    return file.name?.toLowerCase().endsWith('.pdf') ?? false
  }

  private getFileFromAttachment() {
    const { href } = this.node.attrs
    if (!href) {
      return null
    }

    const files = this.props?.getFiles?.() || []
    return files.find((f: ExtendedFileAttachment) => f.id === href) || null
  }

  private createPDFPreview(file: ExtendedFileAttachment) {
    this.container.setAttribute('data-pdf-preview', file.id)

    const header = this.createHeader(file)
    const content = this.createContent(file)

    this.container.appendChild(header)
    this.container.appendChild(content)
  }

  private createHeader(file: ExtendedFileAttachment) {
    const header = document.createElement('div')
    header.className = 'attachment-header'

    const icon = this.createIcon()
    const name = this.createFileName(file.name)

    header.append(icon, name)
    return header
  }

  private createIcon() {
    const icon = document.createElement('span')
    icon.className = 'attachment-icon'
    icon.innerHTML = fileMainDocumentIcon
    return icon
  }

  private createFileName(fileName: string) {
    const name = document.createElement('span')
    Object.assign(name, {
      textContent: fileName,
      className: 'attachment-name',
      title: fileName,
    })
    return name
  }

  private createContent(file: ExtendedFileAttachment) {
    const content = document.createElement('div')
    content.className = 'attachment-content'

    const embed = document.createElement('embed')
    Object.assign(embed, {
      src: this.getPDFUrl(file),
      type: 'application/pdf',
      className: 'attachment-pdf',
      height: '400px',
      width: '100%',
    })
    embed.style.border = 'none'

    content.appendChild(embed)
    return content
  }

  private getPDFUrl(file: ExtendedFileAttachment) {
    const baseUrl = file.link || file.id || '#'

    if (baseUrl && baseUrl !== '#') {
      const separator = baseUrl.includes('?') ? '&' : '?'
      return `${baseUrl}${separator}inline=true`
    }

    return baseUrl
  }

  private setMainDocumentSelection() {
    if (this.props.onEditorClick) {
      const event = {
        target: { dataset: { action: 'select-main-document' } },
        stopPropagation: () => {
          // Prevent event bubbling - no-op
        },
      } as unknown as MouseEvent

      this.props.onEditorClick(this.getPos(), this.node, this.getPos(), event)
    }
  }
}

export default createNodeView(AttachmentView)
