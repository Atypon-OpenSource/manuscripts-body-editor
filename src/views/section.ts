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

import { SectionNode } from '@manuscripts/transform'

import { PluginState, sectionTitleKey } from '../plugins/section_title'
import BlockView from './block_view'
import { createNodeView } from './creators'

// handle sections numbering after track-changes process
export const handleSectionNumbering = (sections: PluginState) => {
  sections.forEach((sectionNumber, sectionId) => {
    const section = document.getElementById(sectionId)
    const sectionTitle = section?.querySelector('h1')
    if (sectionTitle) {
      sectionTitle.dataset.sectionNumber = sectionNumber
    }
  })
}
export class SectionView extends BlockView<SectionNode> {
  public elementType = 'section'
  public element: HTMLElement
  public initialise = () => {
    this.createDOM()
    this.createElement()
    this.updateContents()
  }
  public createElement = () => {
    this.contentDOM = document.createElement(this.elementType)
    this.dom.appendChild(this.contentDOM)
  }
  public onUpdateContent = () => {
    const sectionTitles = sectionTitleKey.getState(this.view.state)

    const attrs = this.node.attrs
    if (this.contentDOM) {
      this.contentDOM.id = attrs.id
      if (attrs.category) {
        this.contentDOM.setAttribute('data-category', attrs.category)
      }
    }

    // update sections numbering, when newly inserted section got deleted
    if (sectionTitles) {
      handleSectionNumbering(sectionTitles)
    }
  }
}

export default createNodeView(SectionView)
