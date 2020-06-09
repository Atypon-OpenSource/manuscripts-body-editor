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

import { ManuscriptNodeView } from '@manuscripts/manuscript-transform'
import { AuxiliaryObjectReference } from '@manuscripts/manuscripts-json-schema'

import { ViewerProps } from '../components/Viewer'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class CrossReferenceView<PropsType extends ViewerProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView {
  public selectNode = () => {
    // TODO: navigate to referenced item?
    // TODO: show a list of referenced items?
  }

  public handleClick = () => {
    const auxiliaryObjectReference = this.getAuxiliaryObjectReference(
      this.node.attrs.rid
    )

    if (auxiliaryObjectReference) {
      this.props.history.push({
        pathname: this.props.history.location.pathname,
        hash: '#' + auxiliaryObjectReference.referencedObject,
      })
    }
  }

  public updateContents = () => {
    this.dom.textContent = this.node.attrs.label
    this.dom.addEventListener('click', this.handleClick)
  }

  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public ignoreMutation = () => true

  public getAuxiliaryObjectReference = (id: string) =>
    this.props.getModel<AuxiliaryObjectReference>(id)

  public createDOM = () => {
    this.dom = document.createElement('span')
    this.dom.className = 'cross-reference'
  }
}

export default createNodeView(CrossReferenceView)
