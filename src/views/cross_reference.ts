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

import {
  CrossReferenceNode,
  ManuscriptNodeView,
  Target,
} from '@manuscripts/transform'
import { Location, NavigateFunction } from 'react-router-dom'

import { getChangeClasses } from '../lib/track-changes-utils'
import { objectsKey } from '../plugins/objects'
import { Trackable } from '../types'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export interface CrossReferenceViewProps extends BaseNodeProps {
  navigate: NavigateFunction
  location: Location
}

export class CrossReferenceView
  extends BaseNodeView<Trackable<CrossReferenceNode>>
  implements ManuscriptNodeView
{
  public selectNode = () => {
    // TODO: navigate to referenced item?
    // TODO: show a list of referenced items?
  }

  public handleClick = () => {
    const rids = this.node.attrs.rids
    if (!rids.length) {
      return
    }
    this.props.navigate({
      pathname: this.props.location.pathname,
      hash: '#' + rids[0],
    })
  }

  public updateContents = () => {
    const targets = objectsKey.getState(this.view.state) as Map<
      string,
      Target
    >
    const attrs = this.node.attrs
    const classes = [
      'cross-reference',
      ...getChangeClasses(attrs.dataTracked),
    ]
    this.dom.className = classes.join(' ')

    const label = attrs.rids.length && targets.get(attrs.rids[0])?.label
    // attrs.label contains custom text inserted at cross-reference creation time
    this.dom.textContent = attrs.label || label || ''
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
