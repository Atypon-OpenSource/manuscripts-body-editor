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
import { LongDescNode, schema } from '@manuscripts/transform'
import { TextSelection } from 'prosemirror-state'

import { handleArrowNavigation } from '../lib/navigation-utils'
import BlockView from './block_view'
import { createNodeView } from './creators'
export class AccessibilityElementView extends BlockView<LongDescNode> {
  public contentDOM: HTMLElement

  public initialise() {
    this.createDOM()
    this.createElement()
    this.updateContents()
  }

  public createDOM() {
    this.dom = document.createElement('div')
    this.dom.classList.add('accessibility_element')
    const label = document.createElement('div')
    label.contentEditable = 'false'
    label.className = 'accessibility_element_label'
    label.innerText =
      this.node.type === schema.nodes.long_desc
        ? 'Long description'
        : 'Alt text'
    this.dom.appendChild(label)
  }

  public createElement() {
    super.createElement()
    this.contentDOM.className = 'accessibility_element_input'
    this.contentDOM.setAttribute('contenteditable', 'true')

    this.contentDOM.tabIndex = this.node.type === schema.nodes.alt_text ? 0 : -1

    this.contentDOM.addEventListener('keydown', this.handleKeydown)
  }
  private handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      // Place cursor at the start of the input
      const pos = this.getPos()
      const tr = this.view.state.tr.setSelection(
        TextSelection.create(this.view.state.doc, pos + 1)
      )
      this.view.dispatch(tr)
      this.view.focus()
    } else {
      // Handle arrow navigation (ArrowUp/ArrowDown)
      const parentEl = this.dom.parentElement
      if (!parentEl) {
        return
      }

      const allInputs = Array.from(
        parentEl.querySelectorAll('.accessibility_element_input')
      ) as HTMLElement[]

      handleArrowNavigation(event, allInputs, this.contentDOM, {
        forward: 'ArrowDown',
        backward: 'ArrowUp',
      })
    }
  }
}

export default createNodeView(AccessibilityElementView)
