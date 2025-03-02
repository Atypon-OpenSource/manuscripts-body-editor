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

import { EquationNode, ManuscriptNodeView } from '@manuscripts/transform'

import { renderMath } from '../lib/math'
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class EquationView
  extends BaseNodeView<Trackable<EquationNode>>
  implements ManuscriptNodeView
{
  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('equation')
  }

  public updateContents() {
    super.updateContents()
    this.dom.innerHTML = this.node.attrs.contents
    renderMath(this.dom)
  }

  public ignoreMutation = () => true
}

export default createNodeView(EquationView)
