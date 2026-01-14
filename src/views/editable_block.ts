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

import { ManuscriptNode, schema } from '@manuscripts/transform'

import { ContextMenu, contextMenuBtnClass } from '../lib/context-menu'
import { hasParent, isNotNull } from '../lib/utils'
import BlockView from './block_view'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T

export const EditableBlock = <T extends Constructor<BlockView<ManuscriptNode>>>(
  Base: T
) => {
  return class extends Base {
    public gutterButtons() {
      const buttons = [this.createAddButton(), this.createEditButton()].filter(
        isNotNull
      )
      // roving tabindex: first existing button is tabbable
      buttons.forEach((btn) => (btn.tabIndex = -1))
      if (buttons.length > 0) {
        buttons[0].tabIndex = 0
      }

      return buttons
    }

    public actionGutterButtons() {
      return []
    }

    public createAddButton() {
      const hasAccess = this.props.getCapabilities()?.editArticle
      if (!hasAccess) {
        return null
      }

      const $pos = this.view.state.doc.resolve(this.getPos())
      const nodeType = this.node.type
      if (
        nodeType === schema.nodes.hero_image ||
        nodeType === schema.nodes.subtitles ||
        nodeType === schema.nodes.supplements ||
        hasParent($pos, [
          schema.nodes.keywords,
          schema.nodes.bibliography_section,
          schema.nodes.footnotes_section,
        ])
      ) {
        return null
      }

      const button = document.createElement('a')
      button.classList.add('add-block', contextMenuBtnClass)
      button.classList.add('add-block-after')
      button.setAttribute('role', 'button')
      button.setAttribute('aria-label', `Add an element below`)
      button.setAttribute('data-balloon-pos', 'down-left')
      const handleClick = (event: Event) => {
        event.preventDefault()

        const menu = this.createMenu()
        menu.showAddMenu(event.currentTarget as Element)
      }

      button.addEventListener('mousedown', handleClick)
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          handleClick(event)
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          const parent = button.parentElement
          const editButton = parent?.querySelector('.edit-block') as HTMLElement
          if (editButton) {
            editButton.focus()
          }
        }
      })

      return button
    }

    public createEditButton(): HTMLElement | null {
      if (!this.props.getCapabilities()?.editArticle) {
        return null
      }

      const button = document.createElement('a')
      button.classList.add('edit-block', contextMenuBtnClass)
      button.setAttribute('role', 'button')
      button.setAttribute('aria-label', 'Open menu')
      button.setAttribute('data-balloon-pos', 'down-left')
      const handleClick = (event: Event) => {
        event.preventDefault()

        const menu = this.createMenu()
        menu.showEditMenu(event.currentTarget as Element)
      }

      button.addEventListener('mousedown', handleClick)
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          handleClick(event)
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault()
          const parent = button.parentElement
          const addButton = parent?.querySelector('.add-block') as HTMLElement
          if (addButton) {
            addButton.focus()
          }
        }
      })

      return button
    }

    public createMenu = () => {
      return new ContextMenu(this.node, this.view, this.getPos)
    }
  }
}
