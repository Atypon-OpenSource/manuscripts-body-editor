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

import { AltTitlesSectionNode } from '@manuscripts/transform'

import { createNodeView } from './creators'
import { SectionView } from './section'

export class AltTitlesSectionView extends SectionView<AltTitlesSectionNode> {
  public elementType = 'section'
  public element: HTMLElement
  dropdownElement: HTMLDivElement

  public initialise() {
    this.createDOM()
    this.createElement()
    this.updateContents()
  }

  // @TODO - how to track the main title changes to disable titles when the main title is empty?

  createDropDown() {
    if (this.dropdownElement) {
      return
    }
    const dropdown = document.createElement('div')
    const button = document.createElement('button')
    dropdown.classList.add('alt-titles-dropdown')
    const toggleView = () => {
      this.dom.classList.toggle('alt-titles-open')
    }
    button.addEventListener('click', () => {
      toggleView()
    })
    dropdown.appendChild(button)
    this.dropdownElement = dropdown
  }

  public createElement() {
    this.contentDOM = document.createElement(this.elementType)
    this.dom.appendChild(this.contentDOM)
  }

  public updateContents() {
    this.createDropDown()
    super.updateContents()
  }

  // handle sections numbering after track-changes process
  //todo move to plugin
  handleSectionNumbering() {}
}

export default createNodeView(SectionView)
