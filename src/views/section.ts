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

import { sectionTitleKey } from '../plugins/section_title'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class SectionView extends BlockView<SectionNode> {
  public elementType = 'section'

  public initialise() {
    this.createDOM()
    this.createElement()
    this.updateContents()
  }

  public createElement() {
    this.contentDOM = document.createElement(this.elementType)
    this.dom.appendChild(this.contentDOM)
  }

  public updateContents() {
    super.updateContents()
    this.dom.setAttribute('data-category', this.node.attrs.category)
    this.handleSectionNumbering()
  }

  // handle sections numbering after track-changes process
  //todo move to plugin
  handleSectionNumbering() {
    const sections = sectionTitleKey.getState(this.view.state)
    if (!sections) {
      return
    }
    sections.forEach((sectionNumber, id) => {
      const section = document.getElementById(id)
      const sectionTitle = section?.querySelector('h1')
      if (sectionTitle) {
        sectionTitle.dataset.sectionNumber = sectionNumber
      }
    })
  }


  public destroy() {
    super.destroy()
  }
}

export default createNodeView(SectionView)
