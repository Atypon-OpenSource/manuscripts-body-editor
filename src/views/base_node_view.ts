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

import { ManuscriptEditorView, ManuscriptNode } from '@manuscripts/transform'
import { NodeView } from 'prosemirror-view'

import { EditorProps } from '../configs/ManuscriptsEditor'
import {
  addTrackChangesAttributes,
  addTrackChangesClassNames,
} from '../lib/track-changes-utils'
import {
  KeyboardNavigationManager,
  KeyboardNavigationManagerOptions,
} from '../utils/keyboard-navigation-manager'

export class BaseNodeView<Node extends ManuscriptNode> implements NodeView {
  public dom: HTMLElement
  public contentDOM?: HTMLElement
  public elementType = 'div'
  protected keyboard?: KeyboardNavigationManager

  public constructor(
    public readonly props: EditorProps,
    public node: Node,
    public readonly view: ManuscriptEditorView,
    public readonly getPos: () => number
  ) {}

  public update(newNode: ManuscriptNode) {
    // if (!newNode.sameMarkup(this.node)) return false
    if (newNode.attrs.id !== this.node.attrs.id) {
      return false
    }
    if (newNode.type.name !== this.node.type.name) {
      return false
    }
    this.node = newNode as Node
    this.updateContents()
    this.props.popper.update()
    return true
  }

  public initialise() {
    // extend this
  }

  public updateContents() {
    //this should be in initialize
    if (this.node.attrs.id) {
      this.dom.id = this.node.attrs.id
    }
    if (this.contentDOM) {
      this.contentDOM.removeAttribute('id')
    }
    this.handleTrackChanges()
    // extend this
  }

  public handleTrackChanges() {
    addTrackChangesAttributes(this.node.attrs, this.dom)
    addTrackChangesClassNames(this.node.attrs, this.dom)
  }

  public selectNode() {
    this.dom.classList.add('ProseMirror-selectednode')
  }

  public deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode')
    this.props.popper.destroy()
  }

  public setupKeyboardNavigation(
    container: HTMLElement,
    options: KeyboardNavigationManagerOptions
  ) {
    this.keyboard = new KeyboardNavigationManager(container, options)
  }

  public destroy() {
    this.keyboard?.cleanup()
    this.props.popper.destroy()
  }
}
