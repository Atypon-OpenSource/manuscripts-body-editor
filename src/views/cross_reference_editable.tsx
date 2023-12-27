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

import { skipTracking } from '@manuscripts/track-changes-plugin'
import { CrossReferenceNode, Target } from '@manuscripts/transform'
import { TextSelection } from 'prosemirror-state'
import React from 'react'

import { CrossReferenceItems } from '../components/views/CrossReferenceItems'
import { objectsKey } from '../plugins/objects'
import { createEditableNodeView } from './creators'
import { CrossReferenceView, CrossReferenceViewProps } from './cross_reference'
import { EditableBlockProps } from './editable_block'

export class CrossReferenceEditableView extends CrossReferenceView<
  CrossReferenceViewProps & EditableBlockProps
> {
  protected popperContainer: HTMLDivElement

  public selectNode = () => {
    const { getCapabilities, renderReactComponent } = this.props

    const xref = this.node as CrossReferenceNode
    const rids = xref.attrs.rids
    const can = getCapabilities()

    if (!can?.editArticle || rids.length) {
      return
    }

    if (!this.popperContainer) {
      this.popperContainer = document.createElement('div')
      this.popperContainer.className = 'cross-reference-editor'
    }

    renderReactComponent(
      <CrossReferenceItems
        handleSelect={this.handleSelect}
        targets={this.getTargets()}
        handleCancel={this.handleCancel}
        currentTargetId={rids[0]}
        currentCustomLabel={this.node.attrs.customLabel}
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
    this.handleCancel()
  }

  public getTargets = () => {
    const targets = objectsKey.getState(this.view.state) as Map<string, Target>

    return Array.from(targets.values())
  }

  public handleCancel = () => {
    if (!this.node.attrs.rids.length) {
      const { state } = this.view

      const pos = this.getPos()
      const tr = state.tr.delete(pos, pos + this.node.nodeSize)
      tr.setSelection(TextSelection.create(tr.doc, pos))
      skipTracking(tr)
      this.view.dispatch(tr)
    } else {
      this.destroy()
    }
  }

  public handleSelect = async (rid: string, customLabel?: string) => {
    const { state } = this.view

    const pos = this.getPos()

    const tr = state.tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      customLabel: customLabel || '',
      rids: [rid],
    })

    const selection = TextSelection.create(tr.doc, pos)

    this.view.dispatch(tr.setSelection(selection))

    this.destroy()
  }
}

export default createEditableNodeView(CrossReferenceEditableView)
