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

import { TrackedAttrs } from '@manuscripts/track-changes-plugin'
import {
  ManuscriptNode,
  ManuscriptNodeView,
  schema,
} from '@manuscripts/transform'
import { ResolvedPos } from 'prosemirror-model'

import { BaseNodeView } from './base_node_view'

const isGraphicalAbstractFigure = ($pos: ResolvedPos, doc: ManuscriptNode) =>
  $pos.parent.type === schema.nodes.graphical_abstract_section &&
  doc.nodeAt($pos.pos)?.type === schema.nodes.figure_element

export default class BlockView<BlockNode extends ManuscriptNode>
  extends BaseNodeView<BlockNode>
  implements ManuscriptNodeView
{
  public viewAttributes = {
    id: 'id',
    placeholder: 'placeholder',
  }

  public initialise = () => {
    this.createDOM()
    this.createGutter('block-gutter', this.gutterButtons().filter(Boolean))
    this.createElement()
    this.createGutter(
      'action-gutter',
      this.actionGutterButtons().filter(Boolean)
    )
    this.updateContents()
  }

  public updateContents = () => {
    this.updateClasses()
    this.updateAttributes()
    this.onUpdateContent()
  }

  // unfortunately we can't call updateContents in successors because they are not methods but props
  // which means they're inited in the constructor and are not accessible via super.
  // onUpdateContent is provided here to allow to execute additional actions on content update without a need to copy all the code
  // @TODO - rewrite arrow props to methods
  onUpdateContent() {
    return
  }

  public updateClasses = () => {
    if (!this.contentDOM) {
      return
    }

    this.contentDOM.classList.toggle('empty-node', !this.node.childCount)
  }

  public updateAttributes = () => {
    if (!this.contentDOM) {
      return
    }

    const dataTracked = (this.node.attrs.dataTracked || []).filter(
      (attr: TrackedAttrs) => attr.operation !== 'reference'
    )

    if (dataTracked?.length) {
      const lastChange = dataTracked[dataTracked.length - 1]
      this.dom.setAttribute('data-track-status', lastChange.status)
      this.dom.setAttribute('data-track-op', lastChange.operation)
    } else {
      this.dom.removeAttribute('data-track-status')
      this.dom.removeAttribute('data-track-op')
    }

    for (const [key, target] of Object.entries(this.viewAttributes)) {
      if (key in this.node.attrs) {
        const value = this.node.attrs[key]

        if (value) {
          this.contentDOM.setAttribute(target, value)
        } else {
          this.contentDOM.removeAttribute(target)
        }
      }
    }
  }

  public createElement = () => {
    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.className = 'block'

    this.dom.appendChild(this.contentDOM)
  }

  public createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('block-container')
    this.dom.classList.add(`block-${this.node.type.name}`)
  }

  public createGutter = (className: string, buttons: HTMLElement[]) => {
    const gutter = document.createElement('div')
    gutter.setAttribute('contenteditable', 'false')
    gutter.classList.add(className)
    if (
      isGraphicalAbstractFigure(
        this.view.state.doc.resolve(this.getPos()),
        this.view.state.doc
      )
    ) {
      gutter.classList.add('graphical-abstract-figure')
    }

    for (const button of buttons) {
      gutter.appendChild(button)
    }

    this.dom.appendChild(gutter)
  }

  public gutterButtons = (): HTMLElement[] => []

  public actionGutterButtons = (): HTMLElement[] => []
}
