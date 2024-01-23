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

import { CrossReferenceNode, ManuscriptNodeView } from '@manuscripts/transform'
import { History } from 'history'

import { getChangeClasses } from '../lib/track-changes-utils'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export interface CrossReferenceViewProps extends BaseNodeProps {
  history: History
}

export class CrossReferenceView<PropsType extends CrossReferenceViewProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public selectNode = () => {
    // TODO: navigate to referenced item?
    // TODO: show a list of referenced items?
  }

  public handleClick = () => {
    const xref = this.node as CrossReferenceNode
    const rids = xref.attrs.rids
    if (!rids.length) {
      return
    }
    this.props.history.push({
      pathname: this.props.history.location.pathname,
      hash: '#' + rids[0],
    })
  }

  public updateContents = () => {
    const nodeClasses = ['cross-reference', ...getChangeClasses(this.node)]
    this.dom.className = nodeClasses.join(' ')
    this.dom.textContent = this.node.attrs.customLabel || this.node.attrs.label
    this.dom.addEventListener('click', this.handleClick)
  }

  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public ignoreMutation = () => true

  public createDOM = () => {
    this.dom = document.createElement('span')
    this.dom.className = 'cross-reference'
  }
}

export default createNodeView(CrossReferenceView)
