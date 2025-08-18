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

import { ManuscriptNode } from '@manuscripts/transform'
import { TextSelection } from 'prosemirror-state'

import { addBtnIcon } from '../icons'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class AbstractsView extends BaseNodeView<ManuscriptNode> {
  public elementType = 'div'

  public initialise() {
    this.createDOM()
    this.createElement()
    this.updateContents()
  }

  public createDOM() {
    this.dom = document.createElement(this.elementType)
    this.dom.className = 'abstracts'
  }

  public createElement() {
    this.contentDOM = document.createElement(this.elementType)
    this.dom.appendChild(this.contentDOM)
    this.addTranslationBtn()
  }

  private addTranslationBtn() {
    if (this.props.getCapabilities()?.editArticle) {
      const btnContainer = document.createElement('div')
      btnContainer.className = 'add-translation-container'
      btnContainer.addEventListener('click', () => this.addTranslation())

      const addTranslationBtn = Object.assign(
        document.createElement('button'),
        {
          className: 'add-button',
          innerHTML: addBtnIcon,
          title: 'Add Translation',
        }
      )

      // Create text element
      const textElement = document.createElement('span')
      textElement.textContent = 'Add translation'
      textElement.className = 'add-translation-text'

      // Add button and text to container
      btnContainer.appendChild(addTranslationBtn)
      btnContainer.appendChild(textElement)

      this.dom.prepend(btnContainer)
    }
  }

  private addTranslation = () => {
    const { state } = this.view
    const { schema } = state

    // Get document's primary language or default to English
    const documentLanguage = state.doc.attrs.primaryLanguageCode || 'en'

    // Create empty section title
    const sectionTitle = schema.nodes.section_title.create()
    // Create paragraph with placeholder
    const paragraph = schema.nodes.paragraph.create({
      placeholder: 'Type here',
    })

    // Create trans_abstract node with section title and paragraph
    const transAbstractNode = schema.nodes.trans_abstract.create(
      {
        lang: documentLanguage, // Use document's primary language
      },
      [sectionTitle, paragraph]
    )

    // Insert the node at the end of the abstracts container
    const tr = state.tr.insert(
      this.getPos() + this.node.nodeSize - 1,
      transAbstractNode
    )

    // Set the selection inside the section title
    const titlePos = this.getPos() + this.node.nodeSize
    const selection = TextSelection.create(tr.doc, titlePos)

    tr.setSelection(selection).scrollIntoView()
    this.view.dispatch(tr)
  }

  public updateContents() {
    super.updateContents()
  }
}

export default createNodeView(AbstractsView)
