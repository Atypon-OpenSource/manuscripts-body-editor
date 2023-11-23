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
import { ManuscriptNodeView } from '@manuscripts/transform'
import { DOMSerializer } from 'prosemirror-model'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
export interface Props extends BaseNodeProps {
  getCapabilities: () => Capabilities
}
export class AffiliationView<PropsType extends Props>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public stopEvent = () => true
  public ignoreMutation = () => true
  
  public initialise = () => {
    const toDOM = this.node.type.spec.toDOM
    if (toDOM) {
      const { dom, contentDOM } = DOMSerializer.renderSpec(document, toDOM(this.node))
      this.dom = dom as HTMLElement
      this.contentDOM = (contentDOM as HTMLElement) || undefined
    }
    this.updateContents()
  }
  
  public updateContents = () => {
    let {institution, addressLine1, country} = this.node.attrs
    let complexInstitutionName = Array.from([institution, addressLine1, country]).filter(Boolean).join(', ')  
    this.dom.innerHTML = complexInstitutionName
  }
}

export default createNodeView(AffiliationView)
