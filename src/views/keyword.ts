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

import { sanitize } from '../lib/dompurify'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class KeywordView<PropsType extends BaseNodeProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public updateContents = () => {
    try {
      const fragment = sanitize(this.node.attrs.contents)
      this.dom.innerHTML = ''
      this.dom.appendChild(fragment)
    } catch (e) {
      console.error(e) // tslint:disable-line:no-console
      // TODO: improve the UI for presenting offline/import errors
      window.alert(
        'There was an error loading the HTML purifier, please reload to try again'
      )
    }
  }

  protected createDOM = () => {
    this.dom = document.createElement('span')
    this.dom.classList.add('keyword')
    this.dom.setAttribute('id', this.node.attrs.id)

    this.contentDOM = this.dom
  }
}

export default createNodeView(KeywordView)
