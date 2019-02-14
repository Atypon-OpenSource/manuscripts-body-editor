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
  buildComment,
  ManuscriptEditorView,
  ManuscriptNode,
  nodeNames,
} from '@manuscripts/manuscript-transform'
import { Decoration, NodeView } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { ContextMenu } from '../lib/context-menu'
import { attentionIconHtml, SyncError } from '../lib/sync-errors'

abstract class AbstractBlock implements NodeView {
  protected get elementType() {
    return 'div'
  }

  public dom: HTMLElement
  public contentDOM: HTMLElement

  protected syncErrors: SyncError[]
  protected readonly props: EditorProps
  protected readonly getPos: () => number
  protected node: ManuscriptNode
  protected readonly icons = {
    plus:
      '<svg width="16" height="16" stroke="currentColor"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>',
    circle:
      '<svg width="16" height="16" stroke="currentColor"><circle r="4" cx="8" cy="8"/></svg>',
  }
  protected readonly view: ManuscriptEditorView

  protected constructor(
    props: EditorProps,
    node: ManuscriptNode,
    view: ManuscriptEditorView,
    getPos: () => number
  ) {
    this.props = props
    this.node = node
    this.view = view
    this.getPos = getPos
  }

  public update(newNode: ManuscriptNode, decorations?: Decoration[]): boolean {
    if (!newNode.sameMarkup(this.node)) return false
    this.handleDecorations(decorations)
    this.node = newNode
    this.updateContents()
    return true
  }

  protected initialise() {
    this.createDOM()
    this.createGutter()
    this.createElement()
    this.createActionGutter()
    this.updateContents()
  }

  protected updateContents() {
    if (this.node.childCount) {
      this.contentDOM.classList.remove('empty-node')
    } else {
      this.contentDOM.classList.add('empty-node')
    }
  }

  protected createElement() {
    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.className = 'block'

    Object.entries(this.node.attrs).forEach(([key, value]) => {
      // ignore empty or null-like values
      if (value !== '' && value != null) {
        this.contentDOM.setAttribute(key, value)
      }
    })

    this.dom.appendChild(this.contentDOM)
  }

  protected handleDecorations(decorations?: Decoration[]) {
    if (decorations) {
      const syncErrorDecoration = decorations.find(
        decoration => decoration.spec.syncErrors
      )
      this.syncErrors = syncErrorDecoration
        ? syncErrorDecoration.spec.syncErrors
        : []
      this.dom.classList.toggle('has-sync-error', this.syncErrors.length > 0)
    }
  }

  private createDOM() {
    this.dom = document.createElement('div')
    this.dom.classList.add('block-container')
    this.dom.classList.add(`block-${this.node.type.name}`)
  }

  private createGutter() {
    const gutter = document.createElement('div')
    gutter.setAttribute('contenteditable', 'false')
    gutter.classList.add('block-gutter')
    gutter.appendChild(this.createAddButton(false))
    gutter.appendChild(this.createEditButton())
    gutter.appendChild(this.createSpacer())
    gutter.appendChild(this.createAddButton(true))
    this.dom.appendChild(gutter)
  }

  private createActionGutter() {
    const gutter = document.createElement('div')
    gutter.setAttribute('contenteditable', 'false')
    gutter.classList.add('action-gutter')

    gutter.appendChild(this.createSyncWarningButton())

    this.dom.appendChild(gutter)
  }

  private createSyncWarningButton = () => {
    const warningButton = document.createElement('button')
    warningButton.classList.add('action-button')
    warningButton.classList.add('has-sync-error')
    const humanReadableType = nodeNames.get(this.node.type) || 'element'
    warningButton.title = `This ${humanReadableType.toLowerCase()} failed to synchronize.\n
Please contact support@manuscriptsapp.com if it fails to save after retrying.`

    warningButton.innerHTML = attentionIconHtml()
    warningButton.addEventListener('click', () => {
      this.props.retrySync(this.syncErrors.map(error => error._id)).catch(e => {
        throw e
      })
    })

    return warningButton
  }

  // private createCommentButton = () => {
  //   const commentButton = document.createElement('button')
  //   commentButton.classList.add('action-button')
  //   commentButton.textContent = '💬'
  //   commentButton.addEventListener('click', async () => {
  //     await this.createComment(this.node.attrs.id)
  //   })

  //   return commentButton
  // }

  private createAddButton = (after: boolean) => {
    const button = document.createElement('a')
    button.classList.add('add-block')
    button.classList.add(after ? 'add-block-after' : 'add-block-before')
    button.title = 'Add a new block'
    button.innerHTML = this.icons.plus
    button.addEventListener('mousedown', event => {
      event.preventDefault()
      event.stopPropagation()

      const menu = this.createMenu()
      menu.showAddMenu(event.currentTarget as HTMLAnchorElement, after)
    })

    return button
  }

  private createEditButton = () => {
    const button = document.createElement('a')
    button.classList.add('edit-block')
    button.title = 'Edit block'
    button.innerHTML = this.icons.circle
    button.addEventListener('mousedown', event => {
      event.preventDefault()
      event.stopPropagation()

      const menu = this.createMenu()
      menu.showEditMenu(event.currentTarget as HTMLAnchorElement)
    })

    return button
  }

  private createMenu = () =>
    new ContextMenu(this.node, this.view, this.getPos, {
      createComment: this.createComment,
    })

  private createSpacer = () => {
    const spacer = document.createElement('div')
    spacer.classList.add('block-gutter-spacer')

    return spacer
  }

  private createComment = async (id: string) => {
    const user = this.props.getCurrentUser()

    const comment = buildComment(user._id, id)

    await this.props.saveModel(comment)
  }
}

export default AbstractBlock
