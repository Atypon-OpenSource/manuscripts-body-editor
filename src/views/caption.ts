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

import { ManuscriptNode, ManuscriptNodeView } from '@manuscripts/transform'

import { BaseNodeView } from './base_node_view'
import { createEditableNodeView } from './creators'

export class CaptionNodeView
  extends BaseNodeView<ManuscriptNode>
  implements ManuscriptNodeView
{
  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public updateContents = () => {
    if (!this.node.textContent) {
      this.dom.classList.add('placeholder')
    } else {
      this.dom.classList.remove('placeholder')
    }
    this.dom.setAttribute(
      'data-placeholder-text',
      this.node.attrs.placeholder || 'Caption...'
    )
  }

  protected createDOM = () => {
    this.dom = document.createElement('p')
    this.dom.className = 'caption-description'
    this.dom.setAttribute('id', this.node.attrs.id)

    if (!this.node.textContent) {
      this.dom.classList.add('placeholder')
    }

    this.contentDOM = this.dom
  }
}

export default createEditableNodeView(CaptionNodeView)
