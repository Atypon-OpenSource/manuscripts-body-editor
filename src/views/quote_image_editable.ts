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

import { plusIcon } from '../icons'
import {
  addTrackChangesAttributes,
  addTrackChangesClassNames,
  isDeleted,
} from '../lib/track-changes-utils'
import { createEditableNodeView } from './creators'
import { FigureEditableView } from './figure_editable'

export class QuoteImageEditableView extends FigureEditableView {
  closeButton: HTMLButtonElement
  isInPullQuote: boolean

  override createDOM() {
    this.dom = document.createElement('figure')

    this.container = document.createElement('div')
    this.container.className = 'pullquote-figure'
    this.container.contentEditable = 'false'
    this.dom.appendChild(this.container)
  }

  override addTools() {
    if (!this.closeButton) {
      const closeButton = document.createElement('button')
      closeButton.innerHTML = plusIcon
      closeButton.classList.add('figure-remove-button', 'button-reset')

      closeButton.addEventListener('click', () => {
        if (this.node.attrs.src) {
          this.setSrc('')
        } else {
          const { tr } = this.view.state
          tr.delete(this.getPos(), this.getPos() + this.node.nodeSize)
          this.view.dispatch(tr)
        }
      })

      this.closeButton = closeButton
    }
  }

  public override updateContents() {
    super.updateContents()

    if (!isDeleted(this.node)) {
      this.container.appendChild(this.closeButton)
    }
    addTrackChangesAttributes(this.node.attrs, this.dom)
    addTrackChangesClassNames(this.node.attrs, this.dom)
  }

  protected override createPlaceholder = () => {
    const element = document.createElement('div')
    element.classList.add('figure', 'placeholder')

    const instructions = document.createElement('div')
    instructions.classList.add('instructions')
    instructions.innerHTML = `${plusIcon}<div>Drag or click here to upload image</div>`

    element.appendChild(instructions)

    return element
  }
}

export default createEditableNodeView(QuoteImageEditableView)
