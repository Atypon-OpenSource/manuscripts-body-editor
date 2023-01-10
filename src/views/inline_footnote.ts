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
import { History } from 'history'

import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export interface InlineFootnoteProps extends BaseNodeProps {
  history: History
}

export class InlineFootnoteView<PropsType extends InlineFootnoteProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView {
  public handleClick = () => {
    this.props.history.push({
      ...this.props.history.location,
      hash: '#' + this.node.attrs.rid,
    })
  }

  public updateContents = () => {
    this.setDomAttrs(this.node, this.dom)
  }

  public initialise = () => {
    this.dom = this.createDOM()
    this.dom.classList.add('footnote')
    this.dom.addEventListener('click', this.handleClick)
    this.updateContents()
  }

  public ignoreMutation = () => true

  public createDOM = () => {
    return document.createElement('span')
  }
}

export default createNodeView(InlineFootnoteView)
