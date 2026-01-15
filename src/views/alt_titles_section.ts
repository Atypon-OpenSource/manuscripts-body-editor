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
import { TextSelection } from 'prosemirror-state'
import { findChildrenByType } from 'prosemirror-utils'

import { arrowDown } from '../icons'
import { altTitlesKey } from '../plugins/alt-titles'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class AltTitleSectionView extends BlockView<
  Trackable<AltTitlesSectionNode>
> {
  private container: HTMLElement

  public ignoreMutation = () => true

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block')
    this.dom.appendChild(this.container)

    // figure group
    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('alt-titles-section')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.container.appendChild(this.contentDOM)
    this.container.appendChild(this.createClosingPanel())
  }

  createClosingPanel() {
    const closingPanel = document.createElement('div')
    closingPanel.classList.add('alt-titles-closing-panel')
    const button = document.createElement('button')
    button.classList.add('alt-titles-closing-button', 'button-reset')
    button.setAttribute('aria-label', 'Collapse alternative titles')

    button.innerHTML = arrowDown
    const handleCollapse = () => {
      const tr = this.view.state.tr.setMeta(altTitlesKey, {
        collapsed: true,
      })
      const titleNode = findChildrenByType(
        this.view.state.doc,
        this.view.state.schema.nodes.title
      )[0]
      const subtitleNode = findChildrenByType(
        this.view.state.doc,
        this.view.state.schema.nodes.subtitle
      )[0]

      const prev = subtitleNode || titleNode
      if (prev) {
        const titleEndPos = prev.pos + prev.node.nodeSize
        tr.setSelection(TextSelection.create(tr.doc, titleEndPos))
      }
      this.view.dispatch(tr)

      // Focus the toggle button after collapse
      const toggleButton = this.view.dom.querySelector(
        '.toggle-button-open'
      ) as HTMLElement
      toggleButton?.focus()
    }

    button.addEventListener('click', (e) => {
      e.preventDefault()
      handleCollapse()
    })

    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleCollapse()
      }
    })
    closingPanel.appendChild(button)
    return closingPanel
  }
}

export default createNodeView(AltTitleSectionView)
