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
import BlockView from './block_view'
import { createNodeView } from './creators'

export class AwardsView extends BlockView<AwardsNode> {
  public elementType = 'div'
  public wrapper: HTMLElement

  public createElement = () => {
    this.wrapper = document.createElement(this.elementType)
    this.wrapper.classList.add('block')

    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.className = 'block'
    this.wrapper.appendChild(this.contentDOM)
    this.dom.appendChild(this.wrapper)
  }

  public updateContents = () => {
    if (!this.contentDOM) {
      return
    }
    this.wrapper.innerHTML = ''
    const header = createHeader(this.node.type.name, 'Funder Information')
    this.wrapper.append(header, this.contentDOM)
  }
}

export default createNodeView(AwardsView)
