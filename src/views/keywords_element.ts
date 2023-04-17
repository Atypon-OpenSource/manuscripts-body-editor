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

import { Model } from '@manuscripts/json-schema'
import { Capabilities } from '@manuscripts/style-guide'
import { Build } from '@manuscripts/transform'
import { DefaultTheme } from 'styled-components'

import { Dispatch } from '../commands'
import { AddKeywordInline } from '../components/keywords/AddKeywordInline'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

export interface KeywordsElementProps {
  getCapabilities: () => Capabilities
  dispatch?: Dispatch
  theme?: DefaultTheme
  retrySync: (componentIDs: string[]) => Promise<void>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
}

export class KeywordsElementView extends BlockView<
  BaseNodeProps & KeywordsElementProps
> {
  private element: HTMLElement
  public editingTools: HTMLDivElement

  public ignoreMutation = () => true

  public stopEvent = () => true

  public createElement = () => {
    this.element = document.createElement('div')
    this.element.classList.add('block')
    this.dom.appendChild(this.element)

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('keywords-list')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.contentDOM.setAttribute('contenteditable', 'false')

    this.element.appendChild(this.contentDOM)
  }

  public updateContents = () => {
    this.editingTools?.remove()

    this.editingTools = ReactSubView(
      this.props,
      AddKeywordInline,
      {},
      this.node,
      this.getPos,
      this.view,
      'keywords-editor'
    )

    if (this.editingTools) {
      this.element.appendChild(this.editingTools)
    }
  }
}

export default createNodeView(KeywordsElementView)
