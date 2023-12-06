/*!
 * © 2023 Atypon Systems LLC
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
import { ManuscriptNodeView } from '@manuscripts/transform'
import React from 'react'

import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'

export interface ContributorsSectionProps extends EditableBlockProps {
  components: Record<string, React.ComponentType<any>>
  subscribeStore: any
}

export class ContributorsSectionView<PropsType extends ContributorsSectionProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  private metadata: HTMLDivElement

  public initialise = () => {
    this.createDOM()
  }

  protected createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('contributors')

    const can = this.props.getCapabilities()

    const {
      components: { MetadataContainer },
      subscribeStore,
    } = this.props

    this.metadata = ReactSubView(
      this.props,
      MetadataContainer as React.FC<any>,
      {
        allowInvitingAuthors: false,
        showAuthorEditButton: true,
        disableEditButton: !can.editMetadata,
        subscribe: subscribeStore,
      },
      this.node,
      this.getPos,
      this.view,
      'metadata-container'
    )

    if (this.metadata) {
      this.dom.appendChild(this.metadata)
    }
  }

  public ignoreMutation = () => true

  public stopEvent = () => true
}

export default createNodeView(ContributorsSectionView)
