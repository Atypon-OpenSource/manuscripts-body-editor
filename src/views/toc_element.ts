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

import { TOCElementNode } from '@manuscripts/transform'

import { sanitize } from '../lib/dompurify'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class TOCElementView extends BlockView<TOCElementNode> {
  private element: HTMLElement

  public ignoreMutation = () => true

  public stopEvent = () => true

  public updateContents = () => {
    try {
      const fragment = sanitize(this.node.attrs.contents)
      this.element.innerHTML = ''
      this.element.appendChild(fragment)
    } catch (e) {
      console.error(e) // tslint:disable-line:no-console
      // TODO: improve the UI for presenting offline/import errors
      window.alert(
        'There was an error loading the HTML purifier, please reload to try again'
      )
    }
  }

  public createElement = () => {
    this.element = document.createElement('div')
    this.element.className = 'block'
    this.element.setAttribute('id', this.node.attrs.id)
    this.dom.appendChild(this.element)
  }
}

export default createNodeView(TOCElementView)
