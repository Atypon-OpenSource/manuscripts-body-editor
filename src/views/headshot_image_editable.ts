/*!
 * © 2026 Atypon Systems LLC
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
  addTrackChangesAttributes,
  addTrackChangesClassNames,
} from '@manuscripts/track-changes-plugin'

import { cameraIcon, plusIcon } from '../icons'
import { handleEnterKey } from '../lib/navigation-utils'
import { createEditableNodeView } from './creators'
import { FigureEditableView } from './figure_editable'

export class HeadshotImageEditableView extends FigureEditableView {
  private detachImageButton: HTMLButtonElement

  public ignoreMutation = () => true

  override createDOM() {
    this.dom = document.createElement('figure')
    this.container = document.createElement('div')
    this.container.className = 'headshot-figure'
    this.container.contentEditable = 'false'
    this.dom.appendChild(this.container)
  }

  override addTools() {
    const src = this.node.attrs.src
    const files = this.props.getFiles()
    const file = src && files.filter((f) => f.id === src)[0]
    const link = file && this.props.fileManagement.previewLink(file)
    const can = this.props.getCapabilities()
    if (can.detachFile && link) {
      this.detachImageButton = document.createElement('button')
      this.detachImageButton.innerHTML = plusIcon
      this.detachImageButton.classList.add('headshot-remove-button')
      this.detachImageButton.setAttribute('data-cy', 'headshot-image-detach')
      this.detachImageButton.contentEditable = 'false'
      this.detachImageButton.addEventListener('click', this.handleDetachImage)
      this.detachImageButton.addEventListener(
        'keydown',
        handleEnterKey(this.handleDetachImage)
      )
      this.container.appendChild(this.detachImageButton)
    }
  }

  public override updateContents() {
    super.updateContents()
    addTrackChangesAttributes(this.node.attrs, this.dom)
    addTrackChangesClassNames(this.node.attrs, this.dom)
  }

  protected override createPlaceholder = () => {
    const element = document.createElement('div')
    element.classList.add('figure', 'placeholder')
    element.tabIndex = 0

    const instructions = document.createElement('div')
    instructions.classList.add('instructions')
    instructions.innerHTML = `${cameraIcon}<div>Upload<br>photo</div>`

    element.appendChild(instructions)

    return element
  }

  private handleDetachImage = () => {
    const { state, dispatch } = this.view
    const pos = this.getPos()
    dispatch(state.tr.delete(pos, pos + this.node.nodeSize))
  }

  public destroy() {
    if (this.detachImageButton) {
      this.detachImageButton.removeEventListener(
        'click',
        this.handleDetachImage
      )
    }
    super.destroy()
  }
}

export default createEditableNodeView(HeadshotImageEditableView)
