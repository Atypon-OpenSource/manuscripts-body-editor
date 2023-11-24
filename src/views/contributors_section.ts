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

// import { ListElement } from '@manuscripts/json-schema'
// import { ManuscriptNode } from '@manuscripts/transform'

import { Capabilities } from '@manuscripts/style-guide'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
// import BlockView from './block_view'
import { createNodeView } from './creators'
import { ManuscriptNodeView } from '@manuscripts/transform'

export interface Props extends BaseNodeProps {
  getCapabilities: () => Capabilities
}
export class ContributorsSectionView<PropsType extends BaseNodeProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public initialise = () => {
    console.log('initialise...')
    this.createDOM()
    this.updateContents()
    console.log(this)
  }
  public createDOM = () => {
    console.log('createDOM...')
    // this.dom = document.createElement('div')
    // this.dom.className = 'contriburs_section'
    // this.dom.setAttribute('id', this.node.attrs.id)
    // this.dom.setAttribute('contenteditable', 'false')
    // this.contentDOM = document.createElement('div')
    // this.dom.appendChild(this.contentDOM)
  }
  public updateContents = () => {
    console.log('updateContents...')
    console.log(this)
    if (this.contentDOM) {
      
    }
  }
}

export default createNodeView(ContributorsSectionView)