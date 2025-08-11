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
    this.contentDOM.setAttribute('contenteditable', 'true')
  }
}

export default createNodeView(AccessibilityElementView)
