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

import { selectedSuggestionKey } from '../plugins/selected-suggestion'
import BlockView from './block_view'
import { createNodeView } from './creators'
export class AccessibilityElementView extends BlockView<LongDescNode> {
  public contentDOM: HTMLElement

  public initialise() {
    this.createDOM()
    this.createElement()
    this.updateContents()
  }

  public updateContents() {
    super.updateContents()
    const state = this.view.state
    const selection = selectedSuggestionKey.getState(state)?.suggestion
    if (selection) {
      const block = this.dom.parentNode?.parentElement?.classList.contains(
        'block-container'
      )
        ? this.dom.parentNode?.parentElement
        : this.dom.parentNode?.parentElement?.parentElement
      block &&
        !block.classList.contains('show_accessibility_element') &&
        block.classList.toggle('show_accessibility_element')
    }
  }

  public createDOM() {
    this.dom = document.createElement('div')
    this.dom.classList.add('accessibility_element')
    const label = document.createElement('label')
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
  }
}

export default createNodeView(AccessibilityElementView)
