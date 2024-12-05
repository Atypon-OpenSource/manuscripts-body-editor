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

import { AwardNode } from '@manuscripts/transform'

import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class AwardView extends BlockView<Trackable<AwardNode>> {
  public initialise = () => {
    this.createDOM()
    this.contentDOM = this.dom
    this.updateContents()
  }

  public updateContents = () => {
    if (!this.contentDOM) {
      return
    }

    this.contentDOM.innerHTML = ''
    this.contentDOM.classList.remove('block-container')

    const { recipient, code, source } = this.node.attrs
    if (!recipient && !code && !source) {
      return
    }

    const fragment = document.createDocumentFragment()

    if (source) {
      fragment.appendChild(this.createAwardElement('award-source', source))
    }

    if (code) {
      fragment.appendChild(
        this.createAwardElement(
          'award-code',
          `Grant Number(s): ${code.split(';').join(', ')}`
        )
      )
    }

    if (recipient) {
      fragment.appendChild(
        this.createAwardElement('award-recipient', `Recipient: ${recipient}`)
      )
    }

    this.contentDOM.appendChild(fragment)
  }

  private createAwardElement = (
    className: string,
    textContent: string
  ): HTMLDivElement => {
    const element = document.createElement('div')
    element.classList.add(className)
    element.textContent = textContent
    return element
  }
}

export default createNodeView(AwardView)
