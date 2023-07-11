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

import { isSectionNode, SectionNode } from '@manuscripts/transform'
import { Node as ProsemirrorNode } from 'prosemirror-model'

import { sectionLevel } from '../lib/context-menu'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'

export const isSpecialSection = (node: ProsemirrorNode) => {
  if (isSectionNode(node)) {
    const { attrs } = node as SectionNode
    return (
      attrs.category === 'MPSectionCategory:abstracts' ||
      attrs.category === 'MPSectionCategory:body' ||
      attrs.category === 'MPSectionCategory:backmatter'
    )
  }
}

export class SectionTitleView<
  PropsType extends BaseNodeProps
> extends BlockView<PropsType> {
  public contentDOM: HTMLElement
  public elementType = 'h1'

  public updateContents = () => {
    const $pos = this.view.state.doc.resolve(this.getPos())

    if (isSpecialSection($pos.parent)) {
      this.dom = document.createElement('div')
      this.dom.classList.add('no-title')
      return
    }
    if (this.node.childCount) {
      this.contentDOM.classList.remove('empty-node')
    } else {
      this.contentDOM.classList.add('empty-node')

      this.contentDOM.setAttribute(
        'data-placeholder',
        `${sectionLevel($pos.depth)} heading`
      )
    }
  }
}

export default createNodeView(SectionTitleView)
