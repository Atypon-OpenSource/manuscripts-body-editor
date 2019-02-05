import { Decoration, NodeView } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { ContextMenu } from '../lib/context-menu'
import { executeKernel } from '../lib/jupyter'
import { attentionIconHtml, SyncError } from '../lib/sync-errors'
import { INSERT, modelsKey } from '../plugins/models'
import { ManuscriptEditorView, ManuscriptNode } from '../schema/types'
import { buildComment, buildFigure } from '../transformer/builders'
import { nodeNames } from '../transformer/node-names'

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

  protected executeListing = async (listingID: string, contents: string) => {
    const attachments: any = await this.props
      .allAttachments(listingID)
      .then(rxAttachments => {
        return Promise.all(
          rxAttachments.map(async attachment => {
            const data = await attachment.getData()
            return {
              data,
              mime: attachment.type,
              md5: attachment.digest,
              name: attachment.id,
            }
          })
        )
      })
      .catch(e => {
        // race condition where model is not in db yet
        return []
      })

    // TODO: use hash
    const { blob } = await executeKernel(listingID, attachments, contents)

    // create figure from result
    const figure = buildFigure(blob)

    this.view.dispatch(
      this.view.state.tr
        .setMeta(modelsKey, {
          [INSERT]: [figure],
        })
        .setNodeMarkup(this.getPos(), undefined, {
          ...this.node.attrs,
          containedFigureID: figure._id,
        })
    )
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
    if (this.elementType === 'figure') {
      gutter.appendChild(this.createExecuteButton())
      gutter.appendChild(this.createAttachButton())
    }
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

  private createExecuteButton = () => {
    const executeButton = document.createElement('a')
    executeButton.classList.add('add-block')
    executeButton.classList.add('listing-block-execute')
    executeButton.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>Execute code</title>
    <desc>Created with Sketch.</desc>
    <g id="ExecuteIcon" stroke="#2A6F9D" stroke-width="1" fill="none" fill-rule="evenodd">
        <path d="M13.3944272,5.78885438 L20.2763932,19.5527864 C20.5233825,20.0467649 20.3231581,20.6474379 19.8291796,20.8944272 C19.6903242,20.9638549 19.5372111,21 19.381966,21 L5.61803399,21 C5.06574924,21 4.61803399,20.5522847 4.61803399,20 C4.61803399,19.8447549 4.65417908,19.6916418 4.7236068,19.5527864 L11.6055728,5.78885438 C11.8525621,5.29487588 12.4532351,5.09465154 12.9472136,5.34164079 C13.140741,5.43840449 13.2976635,5.59532698 13.3944272,5.78885438 Z" id="Triangle" stroke-width="1.5" transform="translate(12.500000, 12.500000) rotate(-270.000000) translate(-12.500000, -12.500000) "></path>
    </g>
</svg>`

    executeButton.addEventListener('click', () => {
      const { id, contents } = this.node.child(0).attrs
      this.executeListing(id, contents).catch(e => {
        throw e
      })
    })

    return executeButton
  }

  private createAttachButton = () => {
    const attachButton = document.createElement('a')
    attachButton.classList.add('add-block')
    attachButton.classList.add('listing-block-attach')
    attachButton.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>Attach data</title>
    <desc>Created with Sketch.</desc>
    <g id="AttachIcon" stroke="#2A6F9D" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round">
        <path d="M16.7205863,7.19446237 C16.7205863,13.8961651 16.7205863,17.7781462 16.7205863,18.8404058 C16.7205863,20.4337951 16.1153485,22.8292209 12.6463801,22.8292209 C9.17741171,22.8292209 8.41589875,20.3665679 8.41589875,18.8404058 C8.41589875,17.3142436 8.41589875,5.90437722 8.41589875,4.65233537 C8.41589875,3.40029353 9.2372646,1.67297087 11.2025442,1.67297087 C13.1678238,1.67297087 13.8389655,3.24629629 13.8389655,4.28440966 C13.8389655,5.32252302 13.8389655,16.0585538 13.8389655,17.5990473 C13.8389655,19.1395409 13.6621692,19.7086271 12.5682425,19.7086271 C11.4743158,19.7086271 11.0557402,19.2257897 11.0446904,16.9520505 C11.0446904,15.6931469 11.0109272,12.6476844 10.9434009,7.81566273" id="Path" stroke-width="1.2" transform="translate(12.568243, 12.251096) rotate(-313.000000) translate(-12.568243, -12.251096) "></path>
    </g>
</svg>`

    attachButton.addEventListener('click', () => {
      const { id, contents } = this.node.child(0).attrs
      this.attachToListing(id)
        .catch(e => {
          throw e
        })
        .then(() => this.executeListing(id, contents))
    })

    return attachButton
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
      attachToListing: this.attachToListing,
      executeListing: this.executeListing,
      createComment: this.createComment,
    })

  private createSpacer = () => {
    const spacer = document.createElement('div')
    spacer.classList.add('block-gutter-spacer')

    return spacer
  }

  private attachToListing = (listingID: string) => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.accept = '*/*'
      input.type = 'file'
      input.multiple = true

      input.addEventListener<'change'>('change', (event: Event) => {
        const target = event.target as HTMLInputElement

        if (target.files) {
          resolve(
            Promise.all(
              Array.from(target.files).map(file => {
                return this.props.putAttachment(listingID, {
                  id: file.name, // TODO: unique
                  data: file,
                  type: file.type,
                })
              })
            )
          )
        }
      })

      input.click()
    })
  }

  private createComment = async (id: string) => {
    const user = this.props.getCurrentUser()

    const comment = buildComment(user._id, id)

    await this.props.saveModel(comment)
  }
}

export default AbstractBlock
