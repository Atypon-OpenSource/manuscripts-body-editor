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

import { ManuscriptNode } from '@manuscripts/manuscript-transform'
import { Decoration } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { NodeViewCreator } from '../types'
import Block from './block'

class EquationElement extends Block {
  protected get elementType() {
    return 'figure'
  }

  public update(newNode: ManuscriptNode, decorations?: Decoration[]): boolean {
    if (newNode.type.name !== this.node.type.name) return false
    if (newNode.attrs.id !== this.node.attrs.id) return false
    this.handleDecorations(decorations)
    this.node = newNode
    this.updateContents()
    return true
  }

  public deselectNode() {
    this.props.popper.destroy()
  }

  protected updateContents() {
    const { suppressCaption } = this.node.attrs

    this.dom.classList.toggle('suppress-caption', suppressCaption)
  }
}

const equationElement = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new EquationElement(props, node, view, getPos)

export default equationElement
