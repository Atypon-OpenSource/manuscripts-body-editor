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

import {ManuscriptNodeView} from '@manuscripts/transform'

import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import React from "react";
import {EditableBlockProps} from "./editable_block";

export interface TitleViewProps extends EditableBlockProps {
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
}

export class TitleView<PropsType extends TitleViewProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public contentDOM: HTMLElement
  public metadata: HTMLElement

  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public updateContents = () => {
    const can = this.props.getCapabilities()
    const MetadataContainer = this.props.components['MetadataContainer']

    this.props.unmountReactComponent(this.metadata)
    this.props.renderReactComponent(
      <MetadataContainer
        allowInvitingAuthors={false}
        showAuthorEditButton={true}
        disableEditButton={!can.editMetadata}
      />,
      this.metadata
    )
  }

  protected createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('manuscript-title')

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('article-titles')
    this.dom.appendChild(this.contentDOM)

    this.metadata = document.createElement('div')
    this.metadata.classList.add('metadata')
    this.dom.appendChild(this.metadata)
  }
}

export default createNodeView(TitleView)
