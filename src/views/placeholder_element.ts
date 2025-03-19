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

import { PlaceholderNode } from '@manuscripts/transform'

import { createPlaceholderContent } from '../lib/placeholder'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class PlaceholderElementView extends BlockView<PlaceholderNode> {
  private element: HTMLElement

  public createElement = () => {
    this.element = document.createElement('div')
    this.element.className = 'block'
    this.element.setAttribute('id', this.node.attrs.id)
    this.dom.appendChild(this.element)

    const content = createPlaceholderContent()
    content.className = 'placeholder-item'
    this.element.appendChild(content)
  }
}

export default createNodeView(PlaceholderElementView)
