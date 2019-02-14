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

import {
  AuxiliaryObjectReference,
  buildAuxiliaryObjectReference,
  ManuscriptEditorView,
  ManuscriptNode,
} from '@manuscripts/manuscript-transform'
import { NodeView } from 'prosemirror-view'
import React from 'react'
import { EditorProps } from '../components/Editor'
import { CrossReferenceItems } from '../components/views/CrossReferenceItems'
import { INSERT, modelsKey } from '../plugins/models'
import { objectsKey, Target } from '../plugins/objects'
import { NodeViewCreator } from '../types'

class CrossReference implements NodeView {
  public dom: HTMLElement

  private readonly props: EditorProps
  private node: ManuscriptNode
  private readonly view: ManuscriptEditorView
  private readonly getPos: () => number

  constructor(
    props: EditorProps,
    node: ManuscriptNode,
    view: ManuscriptEditorView,
    getPos: () => number
  ) {
    this.props = props
    this.node = node
    this.view = view
    this.getPos = getPos

    this.initialise()
  }

  public update(newNode: ManuscriptNode) {
    if (!newNode.sameMarkup(this.node)) return false
    this.node = newNode
    this.updateContents()
    this.props.popper.update()
    return true
  }

  public selectNode() {
    const { renderReactComponent } = this.props

    const { rid } = this.node.attrs

    const auxiliaryObjectReference = rid
      ? this.getAuxiliaryObjectReference(rid)
      : null

    const container = document.createElement('div')
    container.className = 'citation-editor'

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
      container
    )

    this.props.popper.show(this.dom, container, 'right')
  }

  public destroy() {
    this.props.popper.destroy()
  }

  public deselectNode() {
    this.props.popper.destroy()
  }

  public stopEvent(event: Event) {
    // https://discuss.prosemirror.net/t/draggable-and-nodeviews/955/13
    return event.type !== 'mousedown' && !event.type.startsWith('drag')
  }

  public ignoreMutation() {
    return true
  }

  private initialise() {
    this.createDOM()
    this.updateContents()
  }

  private getTargets = () => {
    const targets = objectsKey.getState(this.view.state) as Map<string, Target>

    return Array.from(targets.values())
  }

  private handleSelect = (rid: string) => {
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

  private getAuxiliaryObjectReference = (id: string) =>
    this.props.getModel<AuxiliaryObjectReference>(id)

  private createDOM() {
    this.dom = document.createElement('a')
    this.dom.className = 'cross-reference'

    const auxiliaryObjectReference = this.getAuxiliaryObjectReference(
      this.node.attrs.rid
    )

    if (auxiliaryObjectReference) {
      this.dom.setAttribute(
        'href',
        '#' + auxiliaryObjectReference.referencedObject
      )
    }
  }

  private updateContents() {
    this.dom.textContent = this.node.attrs.label
  }
}

const crossReference = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new CrossReference(props, node, view, getPos)

export default crossReference
