/*!
 * © 2025 Atypon Systems LLC
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

import { TransGraphicalAbstractNode } from '@manuscripts/transform'

import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class TransGraphicalAbstractView extends BlockView<
  Trackable<TransGraphicalAbstractNode>
> {
  public elementType = 'section'

  public createDOM() {
    super.createDOM()
    this.dom.classList.add('block-section')
  }

  public createElement() {
    super.createElement()
    if (this.contentDOM) {
      this.contentDOM.classList.add('trans-graphical-abstract')
    }
  }

  public updateContents() {
    super.updateContents()
    this.updateAttributes()
  }

  private updateAttributes() {
    if (this.contentDOM && this.node.attrs.lang) {
      this.contentDOM.lang = this.node.attrs.lang
    }
    if (this.dom && this.node.attrs.category) {
      this.dom.setAttribute('data-category', this.node.attrs.category)
    }
  }
}

export default createNodeView(TransGraphicalAbstractView)
