/*!
 * © 2024 Atypon Systems LLC
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

import { AwardsNode } from '@manuscripts/transform'

import { createHeader } from '../lib/utils'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class AwardsView extends BaseNodeView<AwardsNode> {
  public elementType = 'div'
  container: HTMLElement

  public initialise() {
    this.createDOM()
    this.createElement()
    this.updateContents()
  }

  public createDOM() {
    this.dom = document.createElement(this.elementType)
    this.dom.classList.add(`block-${this.node.type.name}`)
  }

  public createElement = () => {
    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.className = 'block'
  }

  public updateContents() {
    super.updateContents()
    if (!this.contentDOM) {
      return
    }
    this.dom.innerHTML = ''
    this.dom.setAttribute('contenteditable', 'false')
    this.contentDOM.setAttribute('contenteditable', 'false')

    if (this.node.content.size !== 0) {
      const header = createHeader(this.node.type.name, 'Funder Information')
      this.dom.append(header, this.contentDOM)
    }
  }
}

export default createNodeView(AwardsView)
