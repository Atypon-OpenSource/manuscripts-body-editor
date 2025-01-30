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

import {
  ManuscriptNode,
  ManuscriptNodeType,
  schema,
} from '@manuscripts/transform'
import { ResolvedPos } from 'prosemirror-model'
import {
  findChildrenByType,
  findParentNodeOfTypeClosestToPos,
} from 'prosemirror-utils'

import { isCommentingAllowed } from '../commands'
import { ContextMenu, contextMenuBtnClass } from '../lib/context-menu'
import BlockView from './block_view'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T

const isNotNull = <T>(a: T | null): a is T => a !== null

const hasParent = ($pos: ResolvedPos, type: ManuscriptNodeType) => {
  return !!findParentNodeOfTypeClosestToPos($pos, type)
}

export const EditableBlock = <T extends Constructor<BlockView<ManuscriptNode>>>(
  Base: T
) => {
  return class extends Base {
    public gutterButtons() {
      return [this.createAddButton(), this.createEditButton()].filter(isNotNull)
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
      if (hasParent($pos, schema.nodes.keywords)) {
        return null
      }

      const after = !hasParent($pos, schema.nodes.bibliography_section)

      const button = document.createElement('a')
      button.classList.add('add-block', contextMenuBtnClass)
      button.classList.add(after ? 'add-block-after' : 'add-block-before')
      button.setAttribute(
        'aria-label',
        `Add an element ${after ? 'below' : 'above'}`
      )
      button.setAttribute('data-balloon-pos', 'down-left')
      button.addEventListener('mousedown', (event) => {
        event.preventDefault()

        const menu = this.createMenu()
        menu.showAddMenu(event.currentTarget as Element, after)
      })

      return button
    }

    public createEditButton(): HTMLElement | null {
      if (!this.props.getCapabilities()?.editArticle) {
        return null
      }

      const button = document.createElement('a')
      button.classList.add('edit-block', contextMenuBtnClass)
      button.setAttribute('aria-label', 'Open menu')
      button.setAttribute('data-balloon-pos', 'down-left')
      button.addEventListener('mousedown', (event) => {
        event.preventDefault()

        const menu = this.createMenu()
        menu.showEditMenu(event.currentTarget as Element)
      })

      return button
    }

    public createMenu = () => {
      const targetComment = this.getCommentTarget()

      return new ContextMenu(this.node, this.view, this.getPos, {
        addComment: isCommentingAllowed(targetComment.type),
        targetComment,
      })
    }

    public getCommentTarget = () => {
      if (this.node.type === schema.nodes.section_title) {
        const $pos = this.view.state.doc.resolve(this.getPos())
        const parent = $pos.parent
        if (parent.type === schema.nodes.keywords) {
          const groups = findChildrenByType(parent, schema.nodes.keyword_group)
          return groups.length ? groups[0].node : this.node
        }
        return parent
      }
      return this.node
    }
  }
}
