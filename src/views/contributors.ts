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
import BlockView from './block_view'

export interface ContributorsProps extends EditableBlockProps {
  components: Record<string, React.ComponentType<unknown>>
  subscribeStore: unknown
}

export class Contributors<
  PropsType extends ContributorsProps
> extends BlockView<PropsType> {
  // public initialise = () => {
  //   // this.createDOM()
  // }

  // public updateContents = () => {
  //   console.log(this)
  // }

  // public createDOM = () => {
  //   this.dom = document.createElement('div')
  //   this.dom.classList.add('contributors')
  //   const can = this.props.getCapabilities()
  //   const {
  //     components: { AuthorsInlineViewContainer },
  //     subscribeStore,
  //   } = this.props
  //   this.metadata = ReactSubView(
  //     this.props,
  //     AuthorsInlineViewContainer as React.FC<AuthorsViewProps>,
  //     {
  //       showAuthorEditButton: true,
  //       disableEditButton: !can.editMetadata,
  //       subscribe: subscribeStore,
  //     },
  //     this.node,
  //     this.getPos,
  //     this.view,
  //     'metadata-container'
  //   )
  //   if (this.metadata) {
  //     this.dom.appendChild(this.metadata)
  //   }
  // }

  public ignoreMutation = () => true

  public stopEvent = () => true
}

export default createNodeView(Contributors)
