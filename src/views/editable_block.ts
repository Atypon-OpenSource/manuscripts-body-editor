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

import { nodeNames } from '@manuscripts/manuscript-transform'

import { EditorProps } from '../components/Editor'
import { ContextMenu } from '../lib/context-menu'
import BlockView from './block_view'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T

const isNotNull = <T>(a: T | null): a is T => a !== null

export const EditableBlock = <T extends Constructor<BlockView<EditorProps>>>(
  Base: T
) => {
  return class extends Base {
    public gutterButtons = (): HTMLElement[] =>
      [this.createAddButton(true), this.createEditButton()].filter(isNotNull)

    public actionGutterButtons = (): HTMLElement[] =>
      [this.createSyncWarningButton()].filter(isNotNull)

    public createSyncWarningButton = (): HTMLElement | null => {
      if (!this.props.permissions.write) {
        return null
      }

      const { retrySync } = this.props

      const warningButton = document.createElement('button')
      warningButton.classList.add('action-button')
      warningButton.classList.add('sync-warning-button')
      // warningButton.innerHTML = this.icons.attention

      warningButton.addEventListener('click', async () => {
        const errors = this.syncErrors.map((error) => error._id)

        await retrySync(errors)
      })

      warningButton.addEventListener('mouseenter', () => {
        const warning = document.createElement('div')
        warning.className = 'sync-warning'

        warning.appendChild(
          (() => {
            const node = document.createElement('p')
            const humanReadableType = nodeNames.get(this.node.type) || 'element'
            node.textContent = `This ${humanReadableType.toLowerCase()} failed to be saved.`
            return node
          })()
        )

        warning.appendChild(
          (() => {
            const node = document.createElement('p')
            node.textContent = `Please click to retry, and contact support@manuscriptsapp.com if the failure continues.`
            return node
          })()
        )

        this.props.popper.show(warningButton, warning, 'left')
      })

      warningButton.addEventListener('mouseleave', () => {
        this.props.popper.destroy()
      })

      return warningButton
    }

    // public createCommentButton = () => {
    //   const commentButton = document.createElement('button')
    //   commentButton.classList.add('action-button')
    //   commentButton.textContent = '💬'
    //   commentButton.addEventListener('click', async () => {
    //     await this.createComment(this.node.attrs.id)
    //   })

    //   return commentButton
    // }

    public createAddButton = (after: boolean): HTMLElement | null => {
      if (!this.props.permissions.write) {
        return null
      }

      const button = document.createElement('a')
      button.classList.add('add-block')
      button.classList.add(after ? 'add-block-after' : 'add-block-before')
      button.setAttribute(
        'aria-label',
        `Add an element ${after ? 'below' : 'above'}`
      )
      button.setAttribute('data-balloon-pos', 'down-left')
      // button.innerHTML = this.icons.plus
      button.addEventListener('mousedown', (event) => {
        event.preventDefault()
        event.stopPropagation()

        const menu = this.createMenu()
        menu.showAddMenu(event.currentTarget as HTMLAnchorElement, after)
      })

      return button
    }

    public createEditButton = (): HTMLElement | null => {
      if (!this.props.permissions.write) {
        return null
      }

      const button = document.createElement('a')
      button.classList.add('edit-block')
      button.setAttribute('aria-label', 'Open menu')
      button.setAttribute('data-balloon-pos', 'down-left')
      // button.innerHTML = this.icons.circle
      button.addEventListener('mousedown', (event) => {
        event.preventDefault()
        event.stopPropagation()

        const menu = this.createMenu()
        menu.showEditMenu(event.currentTarget as HTMLAnchorElement)
      })

      return button
    }

    public createMenu = () => {
      const { setCommentTarget } = this.props

      return new ContextMenu(this.node, this.view, this.getPos, {
        setCommentTarget,
      })
    }
  }
}
