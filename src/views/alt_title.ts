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

import { createEditableNodeView } from './creators'
import { TitleView } from './title'

import { AltTitleNode, ManuscriptNodeView } from '@manuscripts/transform'

import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class AltTitleView
  extends BaseNodeView<AltTitleNode>
  implements ManuscriptNodeView
{
  public contentDOM: HTMLElement

  public initialise = () => {
    this.createDOM()
  }

  protected createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('manuscript-alt-title')
    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('alt-title-editable')
    const label = document.createElement('p')
    label.innerHTML = this.node.attrs.type
    this.dom.appendChild(label)
    this.dom.appendChild(this.contentDOM)
  }
}

export const altTitleView = createNodeView(AltTitleView)

export default createEditableNodeView(AltTitleView)
