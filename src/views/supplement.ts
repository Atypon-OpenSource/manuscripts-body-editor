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

import { getFileIcon } from '@manuscripts/style-guide'
import { SupplementNode } from '@manuscripts/transform'
import { renderToStaticMarkup } from 'react-dom/server'

import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class SupplementView extends BaseNodeView<Trackable<SupplementNode>> {
  public ignoreMutation = () => true

  public initialise() {
    this.createElement()
    this.updateContents()
  }

  public createElement = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('supplement-item')
    this.dom.classList.add('block')
    this.dom.setAttribute('id', this.node.attrs.id)
    this.dom.setAttribute('href', this.node.attrs.href)

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('supplement-caption')
    this.dom.appendChild(this.contentDOM)

    this.addFileInfo()
  }

  public updateContents() {
    super.updateContents()
    this.refreshFileInfo()
  }

  private addFileInfo() {
    const fileInfoContainer = document.createElement('div')
    fileInfoContainer.classList.add('supplement-file-info')
    fileInfoContainer.contentEditable = 'false'

    // Get the file from the file management system
    const files = this.props.getFiles()
    const file = files.find((f) => f.id === this.node.attrs.href)

    if (file) {
      const iconElement = document.createElement('span')
      iconElement.classList.add('supplement-file-icon')

      const icon = getFileIcon(file.name)
      if (icon) {
        iconElement.innerHTML = renderToStaticMarkup(icon)
      }

      fileInfoContainer.appendChild(iconElement)

      // Add file name
      const fileName = document.createElement('span')
      fileName.classList.add('supplement-file-name')
      fileName.textContent = file.name
      fileInfoContainer.appendChild(fileName)
    } else {
      // Show placeholder if file not found
      const placeholder = document.createElement('span')
      placeholder.textContent = 'File not found'
      fileInfoContainer.appendChild(placeholder)
    }

    // Add file info to the supplement-item
    this.dom.appendChild(fileInfoContainer)
  }

  private refreshFileInfo() {
    // Remove old container if it exists
    const oldInfo = this.dom.querySelector('.supplement-file-info')
    if (oldInfo) {
      oldInfo.remove()
    }

    // Rebuild with the latest attrs
    this.addFileInfo()
  }
}

export default createNodeView(SupplementView)
