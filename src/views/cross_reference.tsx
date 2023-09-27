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

import { AuxiliaryObjectReference } from '@manuscripts/json-schema'
import { ManuscriptNodeView, Target } from '@manuscripts/transform'
import { History } from 'history'
import React from 'react'

import { objectsKey } from '../plugins/objects'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

import { getChangeClasses } from '../lib/track-changes-utils'

export interface CrossReferenceViewProps extends BaseNodeProps {
  history: History
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
}

export class CrossReferenceView<PropsType extends CrossReferenceViewProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  protected popperContainer?: HTMLDivElement

  public selectNode = () => {
    // TODO: navigate to referenced item?
    // TODO: show a list of referenced items?
  }

  public handleClick = () => {
    const auxiliaryObjectReference = this.getAuxiliaryObjectReference(
      this.node.attrs.rid
    )

    if (auxiliaryObjectReference) {
      if (auxiliaryObjectReference.referencedObjects) {
        this.showPopper(auxiliaryObjectReference.referencedObjects)
      } else {
        this.props.history.push({
          pathname: this.props.history.location.pathname,
          hash: '#' + auxiliaryObjectReference.referencedObject,
        })
      }
    }
  }

  public showPopper = (referencedObjects: string[]) => {
    const {
      components: { ReferencesViewer },
      renderReactComponent,
    } = this.props

    if (!this.popperContainer) {
      this.popperContainer = document.createElement('div')
      this.popperContainer.className = 'citation-references'
    }

    const targets = objectsKey.getState(this.view.state) as Map<string, Target>
    const items: { label: string; referencedObject: string }[] = []

    referencedObjects.map((referencedObject) => {
      const target = targets.get(referencedObject)
      if (target && target.label) {
        items.push({
          label: target.label,
          referencedObject,
        })
      }
    })

    renderReactComponent(
      <ReferencesViewer items={items} history={this.props.history} />,
      this.popperContainer
    )

    this.props.popper.show(this.dom, this.popperContainer, 'right')
  }

  public updateContents = () => {
    this.dom.textContent = this.node.attrs.customLabel || this.node.attrs.label
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
    const nodeClasses = ['cross-reference', ...getChangeClasses(this.node)]
    this.dom = document.createElement('span')
    this.dom.className = nodeClasses.join(' ')
  }
}

export default createNodeView(CrossReferenceView)
