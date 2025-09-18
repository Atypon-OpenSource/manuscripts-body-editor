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

import { TransAbstractNode } from '@manuscripts/transform'

import LanguageDropdown from '../components/LanguageDropdown'
import { getLanguageDisplayName } from '../components/LanguageDropdown/languages'
import { translateIcon } from '../icons'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

export class TransAbstractView extends BlockView<Trackable<TransAbstractNode>> {
  public elementType = 'section'
  private languageButton: HTMLButtonElement | null = null

  public createDOM() {
    super.createDOM()
    this.dom.classList.add('block-section')
  }

  public createElement() {
    super.createElement()
    if (this.contentDOM) {
      this.contentDOM.classList.add('trans-abstract')
    }
  }

  public updateContents() {
    super.updateContents()
    this.updateAttributes()
    this.handleLanguageSelector()
  }

  public destroy() {
    this.cleanupLanguageButton()
    super.destroy()
  }

  private updateAttributes() {
    if (this.contentDOM && this.node.attrs.lang) {
      this.contentDOM.lang = this.node.attrs.lang
    }
    if (this.dom && this.node.attrs.category) {
      this.dom.setAttribute('data-category', this.node.attrs.category)
    }
  }

  // Language Selector
  private handleLanguageSelector() {
    this.cleanupLanguageButton()

    if (this.props.getCapabilities()?.editArticle) {
      this.createLanguageButton()
    }
  }

  private createLanguageButton() {
    this.languageButton = document.createElement('button')
    this.languageButton.classList.add('language-selector-btn')
    this.languageButton.setAttribute('data-cy', 'language-selector-btn')

    this.updateButtonContent()
    this.languageButton.addEventListener('click', this.handleButtonClick)
    this.dom.prepend(this.languageButton)
  }

  private cleanupLanguageButton() {
    if (this.languageButton) {
      this.languageButton.removeEventListener('click', this.handleButtonClick)
      this.languageButton.remove()
      this.languageButton = null
    }
  }

  private updateButtonContent(languageCode = this.node.attrs.lang || 'en') {
    if (!this.languageButton) {
      return
    }

    const languageName = getLanguageDisplayName(languageCode)
    // Ensure English shows as "English (Default)"
    const finalLanguageName =
      languageCode === 'en' ? 'English (Default)' : languageName
    this.languageButton.innerHTML = `${finalLanguageName} ${translateIcon}`
  }

  private handleButtonClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (this.languageButton) {
      this.showLanguageDropdown(this.languageButton)
    }
  }

  private showLanguageDropdown(trigger: HTMLElement) {
    const currentLanguage = this.node.attrs.lang || 'en'

    this.props.popper.show(
      trigger,
      this.createDropdownContainer(currentLanguage),
      'bottom-start',
      false // Disable arrow
    )
  }

  private createDropdownContainer(currentLanguage: string) {
    return ReactSubView(
      this.props,
      LanguageDropdown,
      {
        showButton: false,
        currentLanguage,
        onLanguageSelect: this.handleLanguageChange,
      },
      this.node,
      this.getPos.bind(this),
      this.view,
      ['abstracts-language-dropdown']
    )
  }

  private handleLanguageChange = (languageCode: string) => {
    this.updateNodeLanguage(languageCode)
    this.updateButtonContent(languageCode)
  }

  private updateNodeLanguage(languageCode: string) {
    const tr = this.view.state.tr.setNodeMarkup(this.getPos(), undefined, {
      ...this.node.attrs,
      lang: languageCode,
    })
    this.view.dispatch(tr)
  }
}

export default createNodeView(TransAbstractView)
