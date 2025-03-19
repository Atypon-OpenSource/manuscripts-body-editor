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

import { ManuscriptNode, ManuscriptNodeView } from '@manuscripts/transform'

import { addTrackChangesAttributes } from '../lib/track-changes-utils'
import { BaseNodeView } from './base_node_view'

export default class BlockView<BlockNode extends ManuscriptNode>
  extends BaseNodeView<BlockNode>
  implements ManuscriptNodeView
{
  public initialise() {
    this.createDOM()
    this.createGutter('block-gutter', this.gutterButtons().filter(Boolean))
    this.createElement()
    this.createGutter(
      'action-gutter',
      this.actionGutterButtons().filter(Boolean)
    )
    this.updateContents()
  }

  public updateContents() {
    super.updateContents()
    this.updateClasses()
    this.updatePlaceholder()
  }

  handleTrackChanges() {
    addTrackChangesAttributes(this.node.attrs, this.dom)
  }

  public updateClasses() {
    if (!this.contentDOM) {
      return
    }
    this.contentDOM.classList.toggle('empty-node', !this.node.childCount)
  }

  public updatePlaceholder() {
    if (!this.contentDOM) {
      return
    }
    if (this.node.attrs.placeholder) {
      this.contentDOM.dataset.placeholder = this.node.attrs.placeholder
    }
  }

  public createElement() {
    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.className = 'block'
    this.dom.appendChild(this.contentDOM)
  }

  public createDOM() {
    this.dom = document.createElement('div')
    this.dom.classList.add('block-container')
    this.dom.classList.add(`block-${this.node.type.name}`)
  }

  public createGutter(className: string, buttons: HTMLElement[]) {
    const gutter = document.createElement('div')
    gutter.setAttribute('contenteditable', 'false')
    gutter.classList.add(className)

    for (const button of buttons) {
      gutter.appendChild(button)
    }

    this.dom.appendChild(gutter)
  }

  public gutterButtons(): HTMLElement[] {
    return []
  }

  public actionGutterButtons(): HTMLElement[] {
    return []
  }
}
