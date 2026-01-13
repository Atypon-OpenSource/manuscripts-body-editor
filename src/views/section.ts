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

import { schema, SectionNode } from '@manuscripts/transform'

import { addAuthorIcon } from '../icons'
import { sectionTitleKey } from '../plugins/section_title'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { insertTransAbstract } from '../commands'
import { hasParent } from '../lib/utils'

export class SectionView extends BlockView<SectionNode> {
  public elementType = 'section'
  private addTranslationButton?: HTMLElement

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
    this.handleAddTranslationButton()
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

  // Handle Add Translation button for abstract sections
  private handleAddTranslationButton() {
    this.addTranslationButton?.remove()
    this.addTranslationButton = undefined

    const can = this.props.getCapabilities()
    if (!can.editArticle) {
      return
    }

    // Only show button for sections within abstracts
    const state = this.view.state
    const $pos = state.doc.resolve(this.getPos())
    if (hasParent($pos, schema.nodes.abstracts) && insertTransAbstract(state)) {
      this.addTranslationButton = this.createAddTranslationButton()
      this.dom.append(this.addTranslationButton)
    }
  }

  private createAddTranslationButton() {
    const button = document.createElement('button')
    button.className = 'add-trans-abstract'
    button.title = 'Add translation'
    button.innerHTML = `${addAuthorIcon} <span class="add-trans-abstract-text">Add translation</span>`

    button.addEventListener('mousedown', (event) => {
      event.preventDefault()
      event.stopPropagation()
      insertTransAbstract(
        this.view.state,
        this.view.dispatch,
        this.node.attrs.category
      )
    })

    return button
  }

  public destroy() {
    super.destroy()
  }
}

export default createNodeView(SectionView)
