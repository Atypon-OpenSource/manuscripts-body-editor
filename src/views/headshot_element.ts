/*!
 * © 2026 Atypon Systems LLC
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

import { HeadshotElementNode } from '@manuscripts/transform'
import { TextSelection } from 'prosemirror-state'

import { plusIcon } from '../icons'
import { handleEnterKey } from '../lib/navigation-utils'
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class HeadshotElement extends BaseNodeView<
  Trackable<HeadshotElementNode>
> {
  public elementType = 'div'
  private container: HTMLElement
  private deleteHeadshotButton: HTMLElement

  public initialise() {
    this.createElement()
    this.updateContents()
  }

  public createElement = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('headshot-element')
    this.dom.setAttribute('id', this.node.attrs.id)

    this.container = document.createElement('div')
    this.container.classList.add('block')
    this.dom.appendChild(this.container)

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('block-container', 'headshot-element-block')
    this.container.appendChild(this.contentDOM)

    this.deleteHeadshotButton = document.createElement('button')
    this.deleteHeadshotButton.innerHTML = plusIcon
    this.deleteHeadshotButton.classList.add('headshot-remove-button')
    this.deleteHeadshotButton.setAttribute('data-cy', 'headshot-delete')
    this.deleteHeadshotButton.contentEditable = 'false'
    this.deleteHeadshotButton.addEventListener(
      'click',
      this.handleDeleteHeadshot
    )
    this.deleteHeadshotButton.addEventListener(
      'keydown',
      handleEnterKey(this.handleDeleteHeadshot)
    )
    this.container.appendChild(this.deleteHeadshotButton)

    this.dom.appendChild(this.container)
  }

  public updateContents() {
    super.updateContents()
  }

  private handleDeleteHeadshot = () => {
    const { state, dispatch } = this.view
    const { tr } = state
    const pos = this.getPos()

    tr.delete(pos, pos + this.node.nodeSize)
    this.view.focus()
    const $pos = tr.doc.resolve(pos)
    if ($pos.node().nodeSize > 2) {
      // we set selection to the start to prevent it from selecting alt_text & long_desc as we render them for now with empty dom node
      tr.setSelection(
        TextSelection.near(tr.doc.resolve($pos.start()))
      ).scrollIntoView()
    }
    dispatch(tr)
  }

  public destroy() {
    this.deleteHeadshotButton.removeEventListener(
      'click',
      this.handleDeleteHeadshot
    )
    super.destroy()
  }
}

export default createNodeView(HeadshotElement)
