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

import CloseIconDark from '@manuscripts/assets/react/CloseIconDark'
import { ManuscriptNodeView } from '@manuscripts/transform'
import { createElement } from 'react'
import ReactDOM from 'react-dom'

import { sanitize } from '../lib/dompurify'
import {
  isDeleted,
  isPendingInsert,
  isRejectedInsert,
} from '../lib/track-changes-utils'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
export class KeywordView<PropsType extends BaseNodeProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public ignoreMutation = () => true

  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public updateContents = () => {
    if (
      !isDeleted(this.node) &&
      !isRejectedInsert(this.node) &&
      !isPendingInsert(this.node)
    ) {
      try {
        const closeIconWrapper = document.createElement('span')
        closeIconWrapper.classList.add('delete-keyword')
        ReactDOM.render(
          createElement(CloseIconDark, {
            height: 8,
            width: 8,
            color: '#353535',
          }),
          closeIconWrapper
        )

        const fragment = sanitize(this.node.attrs.contents)
        this.dom.innerHTML = ''
        this.dom.appendChild(fragment)
        this.dom.appendChild(closeIconWrapper)
      } catch (e) {
        console.error(e) // tslint:disable-line:no-console
        // TODO: improve the UI for presenting offline/import errors
        window.alert(
          'There was an error loading the HTML purifier, please reload to try again'
        )
      }
    }
  }

  protected createDOM = () => {
    if (
      !isDeleted(this.node) &&
      !isRejectedInsert(this.node) &&
      !isPendingInsert(this.node)
    ) {
      this.dom = document.createElement('span')
      this.dom.classList.add('keyword')
      this.dom.setAttribute('id', this.node.attrs.id)
    }
  }
}

export default createNodeView(KeywordView)
