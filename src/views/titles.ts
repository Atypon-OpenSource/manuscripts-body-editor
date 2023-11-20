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

import { ManuscriptNodeView } from '@manuscripts/transform'

import { isRejectedInsert } from '../lib/track-changes-utils'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class TitlesView<PropsType extends BaseNodeProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public updateContents = () => {
    const titleText = this.node.attrs.title

    if (!isRejectedInsert(this.node)) {
      const titleElement = document.createElement('div')
      titleElement.textContent = titleText

      const blockContainer = document.createElement('div')
      blockContainer.classList.add('block-container')
      blockContainer.appendChild(titleElement)

      this.dom.innerHTML = ''
      this.dom.appendChild(blockContainer)
    } else {
      this.dom.innerHTML = ''
    }
  }

  protected createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('article-title')
    this.contentDOM = this.dom
  }
}

export default createNodeView(TitlesView)
