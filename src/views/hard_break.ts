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

import { HardBreakNode, ManuscriptNodeView } from '@manuscripts/transform'

import { getChangeClasses } from '../lib/track-changes-utils'
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class HardBreakView
  extends BaseNodeView<Trackable<HardBreakNode>>
  implements ManuscriptNodeView
{
  public ignoreMutation = () => true

  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  protected createDOM = () => {
    this.dom = document.createElement('br')
  }

  public updateContents = () => {
    this.dom.classList.remove(...this.dom.classList)
    const dataTracked = this.node.attrs.dataTracked || []
    if (dataTracked.length) {
      const lastChange = dataTracked[dataTracked.length - 1]
      const changeClasses = getChangeClasses([lastChange])
      this.dom.classList.add(...changeClasses)
    }
  }
}

export default createNodeView(HardBreakView)
