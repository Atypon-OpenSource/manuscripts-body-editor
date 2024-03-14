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

import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class EquationElementView<
  PropsType extends BaseNodeProps
> extends BlockView<PropsType> {
  public elementType = 'figure'

  public updateContents = () => {
    const { label } = this.node.attrs
    if (label) {
      const labelEl = document.createElement('label')
      labelEl.textContent = label
      this.dom.appendChild(labelEl)
    }

    if (this.node.attrs.dataTracked?.length) {
      const lastChange =
        this.node.attrs.dataTracked[this.node.attrs.dataTracked.length - 1]
      this.dom.setAttribute('data-track-status', lastChange.status)
      this.dom.setAttribute('data-track-op', lastChange.operation)
    } else {
      this.dom.removeAttribute('data-track-status')
      this.dom.removeAttribute('data-track-type')
    }
  }
}

export default createNodeView(EquationElementView)
