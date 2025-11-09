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
    this.updateContents()
  }

  public updateContents() {
    this.createGutter(
      'action-gutter',
      this.actionGutterButtons().filter(Boolean)
    )
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

  gutter: Record<string, HTMLElement> = {}

  public createGutter(className: string, buttons: HTMLElement[]) {
    if (this.gutter[className]) {
      this.gutter[className].remove()
    }
    this.gutter[className] = document.createElement('div')
    this.gutter[className].setAttribute('contenteditable', 'false')
    this.gutter[className].classList.add(className)

    for (const button of buttons) {
      this.gutter[className].appendChild(button)
    }

    this.dom.appendChild(this.gutter[className])
  }

  public gutterButtons(): HTMLElement[] {
    // this to avoid issue of LEAN-4986, as with empty gutter text cursor will sink if that view was empty and has contenteditable as false
    return [document.createElement('div')]
  }

  public actionGutterButtons(): HTMLElement[] {
    return []
  }
}
