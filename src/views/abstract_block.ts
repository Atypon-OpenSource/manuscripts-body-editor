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
import { Properties } from 'csstype'
import { Decoration, NodeView } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { ContextMenu } from '../lib/context-menu'
import { SyncError } from '../types'

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
    plus: `<img width="16" height="16" alt="plus" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAZElEQVRYR2NkGGDAOMD2M4w6YDQEKAqB1PP//4MS8WxDRrLNIVsjyOJRB4yGwGgIDO8QgPmOWrUlrsIKZ0E04A4gxufDOw2MhsBoCIyGwJAIAWIcSUgNRW1CQoYTIz/qgNEQAAALeVAh12Y0dgAAAABJRU5ErkJggg==">`,
    circle: `<img width="16" height="16" alt="circle" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACl0lEQVRYR+2WS0iUURTHf2fGKXuYLkoqghQD85E6Q9KDhNqk0KrARUEgMRO0ykVCIhakRGQR1SZ0LBdFCze1qKQWbQrMRZPNTBkxliXYQ9IUM53HiW9MEGmcma9Agvngru495/7O/57vnCMs8ieLfD8pgJQC/58CTq+WEKISZbsIu4CgKs8Qui1WulpLxJvMn5WwAtV+XZI1xRmEOsAS45IISotEaGzdKsFEQBICOPpSN0fC3BHIX2aFvdmQs3xmhRUGJyEwAQ+/wFQEULxhK9XXS+VNPIi4ADXvNN02gg8hrzgDajbCqrQ/ux0Nwo0P8Ho8ChEYXUphZ5FMLwQRF8Dp0UsCtYUZUJsXL56Z/SsB8I2DChfdZXLCNIDLozsVnqywIk0FkBEj8vkXjIeg4RVMRlCFina7PI0FsaACTo/eEji0ZzUc3JBY9LOnbg/C42HjJbjptsthUwAuj/YA5a4cKM9KDqBnBNwDGBJ0ux2ywyyAkU4rzxdBli05gG9BOOmPJuNwm0PWmAJwPtchEdZeKI6d+bEcfw9BnS+qwCe3Q9aZBXggQtXxPCjKSE4B7xhc7Y/mwH23XfaZAnB59CxQf2A9VGUnB3DvM9wdij5Bc5tDGk0BOHs1VyL0ZdqwNRUg6bEK8DzvP8Jwug8dDRJMg/xrdnlvCsAwcnq0QaDZngnHchNT4XIA/EYhUurdDjlnuhAZhrtV0za9wGf0gXileCwEHQMzVRDwj5ZR2ikS/isAw/hIr+Zbw3QibEm3opXZyNxm9HES+ifg0Vf0Zzg6Z/qDsL/DLm/jaRa3F8w6SKQdq2JE22KJcOqftuO5UcwOJKJsQ6hQmJbfA0nEQld7qfjiRT13P2EFknGazNkUQEqBlAK/AMVh4iFi1+BYAAAAAElFTkSuQmCC">`,
    attention: `<img width="24" height="24" alt="attention" src="data:image/png;base64,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">`,
  }
  // protected readonly icons = {
  //   plus:
  //     `<svg width="16" height="16" stroke="#65cfff"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>`,
  //   circle:
  //     `<svg width="16" height="16" stroke="#65cfff"><circle r="4" cx="8" cy="8" fill="#fff"/></svg>`,
  //   attention: `<svg width="24" height="24"><g fill="none" fill-rule="evenodd">
  //     <circle fill="#E28327" cx="12" cy="18.7" r="1"></circle>
  //     <rect fill="#E28327" x="11.12" y="7.5" width="1.8" height="9" rx="0.9"></rect>
  //     <path d="M12.901 1.98l9.41 19.587a1 1 0 0 1-.9 1.433H2.59a1 1 0 0 1-.901-1.433l9.41-19.586a1 1 0 0 1 1.802 0z" stroke="#E28327" stroke-width="1.5"></path>
  //   </g></svg>`,
  // }
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

  protected applyStyles(node: HTMLElement, styles: Properties) {
    Object.entries(styles).forEach(([key, value]) => {
      node.style.setProperty(key, value)
    })
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
    warningButton.innerHTML = this.icons.attention

    warningButton.addEventListener('click', async () => {
      const errors = this.syncErrors.map(error => error._id)

      await this.props.retrySync(errors)
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
