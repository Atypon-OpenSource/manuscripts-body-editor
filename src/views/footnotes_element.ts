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

import { FootnotesElementNode, ManuscriptNode } from '@manuscripts/transform'

import BlockView from './block_view'
import { createNodeOrElementView } from './creators'

export class FootnotesElementView extends BlockView<FootnotesElementNode> {
  public elementType = 'div'

  updateClasses() {
    super.updateClasses()
    updateClasses(this.node, this.dom)
  }

  updateContents() {
    super.updateContents()
    this.checkEditability()
  }

  checkEditability = () => {
    const editable =
      this.props.getCapabilities().editArticle && this.node.childCount
        ? 'true'
        : 'false'
    this.contentDOM?.setAttribute('contenteditable', editable)
    this.dom?.setAttribute('contenteditable', editable)
  }
}

const updateClasses = (node: ManuscriptNode, dom: HTMLElement) => {
  !node.childCount && dom.classList.add('empty-node')
  dom.classList.add('footnotes-element')
}

export default createNodeOrElementView(
  FootnotesElementView,
  'div',
  updateClasses
)
