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

import { allowedHref } from '../lib/url'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import { isRejectedInsert } from '../lib/track-changes-utils'

export class LinkView<PropsType extends BaseNodeProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public updateContents = () => {
    const linkText = this.node?.content?.firstChild?.text || ''

    if (!isRejectedInsert(this.node)) {
      const { href, title } = this.node.attrs

      const linkElement = document.createElement('a')
      linkElement.classList.add('link')
      linkElement.style.position = 'relative'

      if (href && allowedHref(href)) {
        linkElement.setAttribute('href', href)
      }
      if (title) {
        linkElement.setAttribute('title', title)
      }
      linkElement.innerHTML = linkText

      this.dom.innerHTML = ''
      this.dom.appendChild(linkElement)
    } else {
      this.dom.innerHTML = linkText
    }
  }

  protected createDOM = () => {
    this.dom = document.createElement('span')
    this.contentDOM = this.dom
  }
}

export default createNodeView(LinkView)
