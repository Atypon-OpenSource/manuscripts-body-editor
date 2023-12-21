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

import { sectionLevel } from '../lib/context-menu'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class SectionTitleView<
  PropsType extends BaseNodeProps
> extends BlockView<PropsType> {
  public contentDOM: HTMLElement
  public elementType = 'h1'

  public updateContents = () => {
    const $pos = this.view.state.doc.resolve(this.getPos())

    if (this.node.childCount) {
      this.contentDOM.classList.remove('empty-node')
    } else {
      this.contentDOM.classList.add('empty-node')
      // the first level is hidden
      // other levels are shifted by 1
      const level = $pos.depth > 1 ? $pos.depth - 1 : $pos.depth
      this.contentDOM.setAttribute(
        'data-placeholder',
        `${sectionLevel(level)} heading`
      )
    }
  }
}

export default createNodeView(SectionTitleView)
