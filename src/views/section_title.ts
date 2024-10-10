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

import { schema, SectionTitleNode } from '@manuscripts/transform'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'

import { sectionLevel } from '../lib/context-menu'
import { sectionTitleKey } from '../plugins/section_title'
import BlockView from './block_view'
import { createNodeView } from './creators'
export class SectionTitleView extends BlockView<SectionTitleNode> {
  public contentDOM: HTMLElement
  public elementType = 'h1'

  public onUpdateContent = () => {
    const $pos = this.view.state.doc.resolve(this.getPos())
    const sectionTitleState = sectionTitleKey.getState(this.view.state)
    const parentSection = findParentNodeOfTypeClosestToPos(
      $pos,
      schema.nodes.section
    )
    const sectionNumber = sectionTitleState?.get(parentSection?.node.attrs.id)
    let level = $pos.depth > 1 ? $pos.depth - 1 : $pos.depth

    if (findParentNodeOfTypeClosestToPos($pos, schema.nodes.box_element)) {
      level = level - 2
    }

    if (this.node.childCount) {
      this.contentDOM.classList.remove('empty-node')
    } else {
      this.contentDOM.classList.add('empty-node')

      if ($pos.node($pos.depth - 1).type === schema.nodes.box_element) {
        this.contentDOM.setAttribute(
          'data-placeholder',
          `Optional box title...`
        )
        // the first level is hidden
        // other levels are shifted by 1
      } else {
        this.contentDOM.setAttribute(
          'data-placeholder',
          `${sectionLevel(level)} heading`
        )
      }
    }
    if (sectionTitleState && sectionNumber) {
      this.contentDOM.dataset.sectionNumber = sectionNumber
      this.contentDOM.dataset.titleLevel = level.toString()
    }
  }
}

export default createNodeView(SectionTitleView)
