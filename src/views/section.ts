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

import { SectionNode, schema } from '@manuscripts/transform'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'
import { TextSelection } from 'prosemirror-state'

import { sectionTitleKey } from '../plugins/section_title'
import { addBtnIcon } from '../icons'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class SectionView extends BlockView<SectionNode> {
  public elementType = 'section'
  public element: HTMLElement
  private addTranslationButton: HTMLButtonElement | null = null

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
    this.cleanupAddTranslationButton()

    // Only show button for sections within abstracts AND with abstract-related categories
    const $pos = this.view.state.doc.resolve(this.getPos())
    const isInAbstracts = findParentNodeOfTypeClosestToPos($pos, schema.nodes.abstracts)
    const isAbstractCategory = this.isAbstractCategory(this.node.attrs.category)
    
    if (isInAbstracts && isAbstractCategory && this.props.getCapabilities()?.editArticle) {
      this.createAddTranslationButton()
    }
  }

  private isAbstractCategory(category: string) {
    // Get section categories from editor props
    const sectionCategories = this.props.sectionCategories
    if (!sectionCategories) {
      return false
    }
    
    // Get the category object
    const categoryObj = sectionCategories.get(category)
    if (!categoryObj) {
      return false
    }
    
    // Check if the category belongs to abstracts or abstracts-graphic groups
    return categoryObj.group === 'abstracts' || categoryObj.group === 'abstracts-graphic'
  }

  private createAddTranslationButton() {
    const btnContainer = document.createElement('div')
    btnContainer.classList.add('add-translation-container')
  
    btnContainer.addEventListener('mousedown', (event) => {
      event.preventDefault()
      event.stopPropagation()
      this.addTranslation()

    })

    const addTranslationBtn = Object.assign(
      document.createElement('button'),
      {
        className: 'add-button',
        innerHTML: addBtnIcon,
        title: 'Add Translation',
        type: 'button', // Explicitly set button type
      }
    )

    // Create text element
    const textElement = document.createElement('span')
    textElement.textContent = 'Add translation'
    textElement.classList.add('add-translation-text')

    // Add button and text to container
    btnContainer.appendChild(addTranslationBtn)
    btnContainer.appendChild(textElement)

    this.dom.appendChild(btnContainer)
    this.addTranslationButton = addTranslationBtn
  }

  private cleanupAddTranslationButton() {
    if (this.addTranslationButton) {
      const container = this.addTranslationButton.closest('.add-translation-container')
      if (container) {
        container.remove()
      }
      this.addTranslationButton = null
    }
  }

  private addTranslation = () => {
    const { state } = this.view
    const { schema } = state

    // Get document's primary language or default to English
    const documentLanguage = state.doc.attrs.primaryLanguageCode || 'en'

    // Create empty section title
    const sectionTitle = schema.nodes.section_title.create()
    // Create empty paragraph
    const paragraph = schema.nodes.paragraph.create()

    // Create trans_abstract node with section title and paragraph
    // Pass the current section's category to the trans_abstract
    const transAbstractNode = schema.nodes.trans_abstract.create(
      {
        lang: documentLanguage,
        category: this.node.attrs.category, // Pass the section's category
      },
      [sectionTitle, paragraph]
    )

    // Insert the node at the end of the abstracts container
    const abstracts = findParentNodeOfTypeClosestToPos(
      this.view.state.doc.resolve(this.getPos()),
      schema.nodes.abstracts
    )
    
    if (abstracts) {
      const tr = state.tr.insert(
        abstracts.pos + abstracts.node.nodeSize - 1,
        transAbstractNode
      )

      // Set the selection inside the section title
      const titlePos = abstracts.pos + abstracts.node.nodeSize
      const selection = TextSelection.create(tr.doc, titlePos)

      tr.setSelection(selection).scrollIntoView()
      this.view.dispatch(tr)
    }
  }

  public destroy() {
    this.cleanupAddTranslationButton()
    super.destroy()
  }
}

export default createNodeView(SectionView)
