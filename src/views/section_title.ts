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

import { EditorProps } from '../components/Editor'
import { sectionLevel } from '../lib/context-menu'
import { NodeViewCreator } from '../types'
import Block from './block'

class SectionTitle extends Block {
  protected get elementType() {
    return 'h1'
  }

  protected updateContents() {
    if (this.node.childCount) {
      this.contentDOM.classList.remove('empty-node')
    } else {
      this.contentDOM.classList.add('empty-node')

      const $pos = this.view.state.doc.resolve(this.getPos())

      this.contentDOM.setAttribute(
        'data-placeholder',
        `${sectionLevel($pos.depth)} heading`
      )
    }
  }
}

const sectionTitle = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new SectionTitle(props, node, view, getPos)

export default sectionTitle
