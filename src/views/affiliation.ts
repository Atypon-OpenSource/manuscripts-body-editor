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

import { Capabilities } from '@manuscripts/style-guide'
import { AffiliationNode, ManuscriptNodeView } from '@manuscripts/transform'

import { affiliationsKey } from '../plugins/affiliations'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
export interface Props extends BaseNodeProps {
  getCapabilities: () => Capabilities
}
export class AffiliationView<PropsType extends BaseNodeProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public initialise = () => {
    this.createDOM()
  }

  public updateContents = () => {
    const attrs = this.node.attrs as AffiliationNode['attrs']

    const pluginState = affiliationsKey.getState(this.view.state)

    this.dom.innerHTML = this.formatAddress(attrs)
    if (pluginState?.indexedAffiliationIds) {
      const order = pluginState.indexedAffiliationIds.get(attrs.id)
      this.dom.innerHTML = order
        ? order + ' ' + this.dom.innerHTML
        : this.dom.innerHTML
      this.dom.setAttribute('style', 'order: ' + (order || 0))
    }

    if (this.node.attrs.dataTracked?.length) {
      this.dom.setAttribute(
        'data-track-status',
        this.node.attrs.dataTracked[0].status
      )
      this.dom.setAttribute(
        'data-track-op',
        this.node.attrs.dataTracked[0].operation
      )
    } else {
      this.dom.removeAttribute('data-track-status')
      this.dom.removeAttribute('data-track-type')
    }
  }

  protected createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('affiliation')
    this.dom.setAttribute('id', this.node.attrs.id)
    this.updateContents()
  }

  public ignoreMutation = () => true

  public stopEvent = () => true

  public formatAddress = (affiliation: AffiliationNode['attrs']): string => {
    const {
      department,
      institution,
      addressLine1,
      city,
      county,
      country,
      postCode,
    } = affiliation

    return [
      department,
      institution,
      addressLine1,
      city,
      county,
      country,
      postCode,
    ]
      .filter(Boolean)
      .join(', ')
  }
}

export default createNodeView(AffiliationView)
