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

import { sectionTitleKey } from '../plugins/section_title'
import BlockView from './block_view'
import { createNodeView } from './creators'
export class SectionTitleView extends BlockView<SectionTitleNode> {
  public contentDOM: HTMLElement
  public elementType = 'h1'
  private element: HTMLElement

  public protectedSectionTitles = [
    schema.nodes.bibliography_section,
    schema.nodes.footnotes_section,
    schema.nodes.graphical_abstract_section,
    schema.nodes.trans_graphical_abstract,
    schema.nodes.supplements,
  ]

  public createElement = () => {
    this.element = document.createElement(this.elementType)
    this.element.className = 'block'
    this.dom.appendChild(this.element)

    const $pos = this.view.state.doc.resolve(this.getPos())

    if (this.protectedSectionTitles.includes($pos.parent.type)) {
      this.element.setAttribute('contenteditable', 'false')
      this.renderContent()
    } else {
      this.contentDOM = this.element
    }
  }

  private renderContent() {
    this.element.textContent = this.node.textContent
  }

  public updateContents() {
    super.updateContents()

    if (!this.element.isContentEditable) {
      this.renderContent()
    }

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
      this.element.classList.remove('empty-node')
    } else {
      this.element.classList.add('empty-node')
    }
    if (sectionTitleState && sectionNumber) {
      this.element.dataset.sectionNumber = sectionNumber
      this.element.dataset.titleLevel = level.toString()
    }
  }
}

export default createNodeView(SectionTitleView)
