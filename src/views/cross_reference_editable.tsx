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

import { buildAuxiliaryObjectReference } from '@manuscripts/manuscript-transform'
import React from 'react'
import { EditorProps } from '../components/Editor'
import { CrossReferenceItems } from '../components/views/CrossReferenceItems'
import { INSERT, modelsKey } from '../plugins/models'
import { objectsKey, Target } from '../plugins/objects'
import { createEditableNodeView } from './creators'
import { CrossReferenceView } from './cross_reference'

export class CrossReferenceEditableView extends CrossReferenceView<
  EditorProps
> {
  protected popperContainer: HTMLDivElement

  public selectNode = () => {
    const { permissions, renderReactComponent } = this.props

    if (!permissions.write) {
      return
    }

    const { rid } = this.node.attrs

    const auxiliaryObjectReference = rid
      ? this.getAuxiliaryObjectReference(rid)
      : null

    if (!this.popperContainer) {
      this.popperContainer = document.createElement('div')
      this.popperContainer.className = 'citation-editor'
    }

    renderReactComponent(
      <CrossReferenceItems
        referencedObject={
          auxiliaryObjectReference
            ? auxiliaryObjectReference.referencedObject
            : null
        }
        handleSelect={this.handleSelect}
        targets={this.getTargets()}
      />,
      this.popperContainer
    )

    this.props.popper.show(this.dom, this.popperContainer, 'right')
  }

  public destroy = () => {
    this.props.popper.destroy()

    if (this.popperContainer) {
      this.props.unmountReactComponent(this.popperContainer)
    }
  }

  public deselectNode = () => {
    this.props.popper.destroy()

    if (this.popperContainer) {
      this.props.unmountReactComponent(this.popperContainer)
    }
  }

  public getTargets = () => {
    const targets = objectsKey.getState(this.view.state) as Map<string, Target>

    return Array.from(targets.values())
  }

  public handleSelect = (rid: string) => {
    const $pos = this.view.state.doc.resolve(this.getPos())

    const auxiliaryObjectReference = buildAuxiliaryObjectReference(
      $pos.parent.attrs.id,
      rid
    )

    this.view.dispatch(
      this.view.state.tr
        .setMeta(modelsKey, { [INSERT]: [auxiliaryObjectReference] })
        .setNodeMarkup(this.getPos(), undefined, {
          ...this.node.attrs,
          rid: auxiliaryObjectReference._id,
        })
        .setSelection(this.view.state.selection)
    )
  }
}

export default createEditableNodeView(CrossReferenceEditableView)
