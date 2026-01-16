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
import {
  addArrowKeyNavigation,
  makeKeyboardActivatable,
} from '@manuscripts/style-guide'
import { LongDescNode, schema } from '@manuscripts/transform'
import { TextSelection } from 'prosemirror-state'

import BlockView from './block_view'
import { createNodeView } from './creators'
export class AccessibilityElementView extends BlockView<LongDescNode> {
  public contentDOM: HTMLElement
  private enterCleanup?: () => void
  private arrowCleanup?: () => void

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

    // Fix tabIndex bug: Use position-based check, not type-based
    const isFirst = () => {
      const pos = this.getPos()
      const parent = this.view.state.doc.resolve(pos).parent
      return parent.firstChild === this.node
    }
    this.contentDOM.tabIndex = isFirst() ? 0 : -1

    // Add Enter key handler using style-guide utility
    this.enterCleanup = makeKeyboardActivatable(
      this.contentDOM,
      () => {
        // Place cursor at the start of the input
        const pos = this.getPos()
        const tr = this.view.state.tr.setSelection(
          TextSelection.create(this.view.state.doc, pos + 1)
        )
        this.view.dispatch(tr)
        this.view.focus()
      },
      { keys: ['Enter'] }
    )

    // Add arrow key navigation using style-guide utility
    const parent = this.dom.parentElement
    if (parent) {
      this.arrowCleanup = addArrowKeyNavigation(parent, {
        selector: '.accessibility_element_input',
        direction: 'vertical',
        loop: true,
      })
    }
  }

  public destroy() {
    this.enterCleanup?.()
    this.arrowCleanup?.()
    super.destroy()
  }
}

export default createNodeView(AccessibilityElementView)
