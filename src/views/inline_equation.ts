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

import { InlineEquationNode, ManuscriptNodeView } from '@manuscripts/transform'

import { renderMath } from '../lib/math'
import { getChangeClasses } from '../lib/track-changes-utils'
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class InlineEquationView
  extends BaseNodeView<Trackable<InlineEquationNode>>
  implements ManuscriptNodeView
{
  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public updateContents = () => {
    const classes = [
      'equation',
      ...getChangeClasses(this.node.attrs.dataTracked),
    ]
    this.dom.className = classes.join(' ')
    this.dom.innerHTML = this.node.attrs.contents
    renderMath(this.dom)
  }

  public ignoreMutation = () => true

  protected createDOM = () => {
    this.dom = document.createElement('span')
    this.dom.setAttribute('id', this.node.attrs.id)
  }
}

export default createNodeView(InlineEquationView)
