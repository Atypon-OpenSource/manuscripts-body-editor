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

import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class AbstractsView extends BaseNodeView<ManuscriptNode> {
  public elementType = 'div'

  public initialise() {
    this.createDOM()
    this.createElement()
    this.updateContents()
  }

  public createDOM() {
    this.dom = document.createElement(this.elementType)
    this.dom.classList.add('abstracts')
  }

  public createElement() {
    this.contentDOM = document.createElement(this.elementType)
    this.dom.appendChild(this.contentDOM)
  }

  public updateContents() {
    super.updateContents()
  }
}

export default createNodeView(AbstractsView)
