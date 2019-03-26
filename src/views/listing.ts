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
  FigureElementNode,
  isFigureElementNode,
  ManuscriptEditorView,
  ManuscriptNode,
} from '@manuscripts/manuscript-transform'
import { base64StringToBlob } from 'blob-util'
import CodeMirror from 'codemirror'
import prettyBytes from 'pretty-bytes'
import { NodeView } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { CodeMirrorCreator } from '../lib/codemirror'
import {
  CodemirrorMode,
  codemirrorModeGroups,
  codemirrorModeLabels,
  codemirrorModeOptions,
} from '../lib/codemirror-modes'
import { NodeViewCreator } from '../types'

interface Output {
  type: 'stderr' | 'stdout' | 'display' | 'error' | 'status'
  text: string
}

class Listing implements NodeView {
  protected get elementType() {
    return 'div'
  }
  public dom: HTMLDivElement
  private container: HTMLElement
  private attachmentsNode: HTMLElement
  private outputNode: HTMLElement

  private parentFigureElement?: {
    node: FigureElementNode
    before: number
    start: number
  }

  private editor: CodeMirror.Editor

  private readonly props: EditorProps
  private readonly getPos: () => number
  private node: ManuscriptNode
  private readonly view: ManuscriptEditorView

  private readonly imports: {
    codemirror: Promise<CodeMirrorCreator>
  }

  constructor(
    props: EditorProps,
    node: ManuscriptNode,
    view: ManuscriptEditorView,
    getPos: () => number
    // decorations?: Decoration[]
  ) {
    this.props = props
    this.node = node
    this.view = view
    this.getPos = getPos
    // this.decorations = decorations

    this.imports = {
      codemirror: import(/* webpackChunkName: "codemirror" */ '../lib/codemirror'),
    }

    this.createDOM()
    this.updateContents()
  }

  public update(newNode: ManuscriptNode): boolean {
    if (newNode.attrs.id !== this.node.attrs.id) return false
    if (newNode.type.name !== this.node.type.name) return false
    this.node = newNode
    this.updateContents()
    return true
  }

  public stopEvent(event: Event) {
    return event.type !== 'mousedown' && !event.type.startsWith('drag')
  }

  public ignoreMutation() {
    return true
  }

  protected updateContents() {
    const { contents, isExpanded, isExecuting } = this.node.attrs

    if (this.editor) {
      if (isExpanded) {
        this.editor.refresh()

        this.updateAttachmentsNode().catch(error => {
          console.error(error) // tslint:disable-line:no-console
        })
      }

      if (contents !== this.editor.getValue()) {
        this.editor.setValue(contents)
      }
    }

    this.dom.classList.toggle('expanded-listing', isExpanded)
    this.dom.classList.toggle('executable-executing', isExecuting)
    this.dom.classList.toggle('executable-has-contents', Boolean(contents))
  }

  protected async updateAttachmentsNode() {
    const attachments = await this.props.allAttachments(this.node.attrs.id)

    const { id } = this.node.attrs

    if (id) {
      this.attachmentsNode.innerHTML = ''

      for (const attachment of attachments) {
        // ignore result attachment(s)
        if (attachment.id === 'result') {
          continue
        }

        const item = document.createElement('div')
        item.className = 'executable-attachment'

        const heading = document.createElement('div')
        heading.className = 'executable-attachment-heading'
        heading.textContent = `${attachment.id} (${prettyBytes(
          attachment.length
        )})`
        item.appendChild(heading)

        const type = document.createElement('div')
        type.className = 'executable-attachment-type'
        type.textContent = attachment.type
        item.appendChild(type)

        this.attachmentsNode.appendChild(item)
      }
    }
  }

  protected createDOM() {
    this.dom = document.createElement('div')
    this.dom.classList.add('listing')

    this.setParentFigureElement()

    if (this.parentFigureElement) {
      const executableContainer = document.createElement('div')
      executableContainer.className = 'executable-container'
      this.dom.appendChild(executableContainer)

      const toggleContainer = document.createElement('div')
      toggleContainer.className = 'toggle-container'
      executableContainer.appendChild(toggleContainer)

      const toggleListingButton = document.createElement('button')
      toggleListingButton.className = 'toggle-listing'
      toggleListingButton.addEventListener('mousedown', event => {
        event.preventDefault()

        const { contents, isExpanded } = this.node.attrs

        this.toggleListing(!isExpanded)

        toggleListingButton.innerHTML = this.toggleIcon(contents, !isExpanded)
        toggleListingButton.appendChild(
          document.createTextNode(this.toggleText(contents, !isExpanded))
        )
      })

      const { contents } = this.node.attrs

      toggleListingButton.innerHTML = this.toggleIcon(contents)
      toggleListingButton.appendChild(
        document.createTextNode(this.toggleText(contents))
      )

      toggleContainer.appendChild(toggleListingButton)

      const executableBody = document.createElement('div')
      executableBody.className = 'executable-body'
      executableContainer.appendChild(executableBody)

      const actionsContainer = document.createElement('div')
      actionsContainer.className = 'executable-actions'
      executableBody.appendChild(actionsContainer)

      const executeButton = document.createElement('button')
      executeButton.classList.add('execute-listing')
      executeButton.classList.add('executable-action')
      executeButton.addEventListener('mousedown', this.executeListing) // TODO: debounce?
      executeButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24">
  <path d="M19.211 13.394L5.447 20.276A1 1 0 0 1 4 19.382V5.618a1 1 0 0 1 1.447-.894l13.764 6.882a1 1 0 0 1 0 1.788z" stroke-width="1.5" stroke="#2A6F9D" fill="none" fill-rule="evenodd"/>
</svg>`
      actionsContainer.appendChild(executeButton)

      const attachButton = document.createElement('button')
      attachButton.classList.add('attach-listing')
      attachButton.classList.add('executable-action')
      attachButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24">
  <path d="M19.098 11.84l-8.517 7.942c-1.165 1.087-3.33 2.278-5.696-.26-2.366-2.537-1.084-4.773.032-5.814l10.377-9.676c.915-.854 2.739-1.431 4.08.006 1.34 1.437.647 3.001-.113 3.71l-9.737 9.08c-1.127 1.05-1.664 1.31-2.41.51-.746-.8-.678-1.436.977-2.995.92-.859 3.125-2.96 6.613-6.305" stroke-width="1.2" stroke="#2A6F9D" fill="none" fill-rule="evenodd" stroke-linecap="round"/>
</svg>`
      attachButton.addEventListener('mousedown', async event => {
        event.preventDefault()
        await this.attachListingData()
        await this.updateAttachmentsNode()
      })
      actionsContainer.appendChild(attachButton)

      const executableMain = document.createElement('div')
      executableMain.className = 'executable-main'
      executableBody.appendChild(executableMain)

      this.container = document.createElement('div')
      this.container.className = 'executable-content'
      executableMain.appendChild(this.container)

      this.attachmentsNode = document.createElement('div')
      this.attachmentsNode.className = 'executable-attachments'
      executableMain.appendChild(this.attachmentsNode)

      this.outputNode = document.createElement('div')
      this.outputNode.className = 'executable-outputs'
      executableMain.appendChild(this.outputNode)

      this.createEditor('Enter code to be executed…').catch(error => {
        console.error(error) // tslint:disable-line:no-console
      })
    } else {
      this.container = document.createElement('div')
      this.dom.appendChild(this.container)

      this.createEditor().catch(error => {
        console.error(error) // tslint:disable-line:no-console
      })
    }
  }

  private toggleText = (contents: string, isExpanded: boolean = false) => {
    if (isExpanded) {
      return 'Hide Code'
    }

    if (contents) {
      return 'Show Code'
    }

    return 'Attach Code'
  }

  private toggleIcon = (contents: string, isExpanded: boolean = false) => {
    if (isExpanded) {
      return `<svg width="12" height="12" xmlns:xlink="http://www.w3.org/1999/xlink" class="toggle-icon">
  <defs>
    <path id="b" d="M6 2l5 8H1z"/>
    <filter x="-305%" y="-256.2%" width="710%" height="862.5%" filterUnits="objectBoundingBox" id="a">
      <feOffset dy="10" in="SourceAlpha" result="shadowOffsetOuter1"/>
      <feGaussianBlur stdDeviation="8.5" in="shadowOffsetOuter1" result="shadowBlurOuter1"/>
      <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.0345052083 0" in="shadowBlurOuter1"/>
    </filter>
  </defs>
  <g transform="rotate(180 6 6)" fill="none" fill-rule="evenodd">
    <use fill="#000" filter="url(#a)" xlink:href="#b"/>
    <use fill="#949494" xlink:href="#b"/>
  </g>
</svg>`
    }

    if (contents) {
      return `<svg width="12" height="12" xmlns:xlink="http://www.w3.org/1999/xlink" class="toggle-icon">
  <defs>
    <path id="b" d="M6 2l5 8H1z"/>
    <filter x="-305%" y="-256.2%" width="710%" height="862.5%" filterUnits="objectBoundingBox" id="a">
      <feOffset dy="10" in="SourceAlpha" result="shadowOffsetOuter1"/>
      <feGaussianBlur stdDeviation="8.5" in="shadowOffsetOuter1" result="shadowBlurOuter1"/>
      <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.0345052083 0" in="shadowBlurOuter1"/>
    </filter>
  </defs>
  <g transform="rotate(90 6 6)" fill="none" fill-rule="evenodd">
    <use fill="#000" filter="url(#a)" xlink:href="#b"/>
    <use fill="#949494" xlink:href="#b"/>
  </g>
</svg>`
    }

    return `<svg width="16" height="17" viewBox="0 0 32 34" class="toggle-icon">
  <g fill="none" fill-rule="evenodd">
    <path d="M20.5 2.278l6 3.464a9 9 0 0 1 4.5 7.794v6.928a9 9 0 0 1-4.5 7.794l-6 3.464a9 9 0 0 1-9 0l-6-3.464A9 9 0 0 1 1 20.464v-6.928a9 9 0 0 1 4.5-7.794l6-3.464a9 9 0 0 1 9 0z" fill="#FDCD47"/>
    <path d="M15.255 15.707v-6a.75.75 0 1 1 1.5 0v6h6a.75.75 0 0 1 0 1.5h-6v6a.75.75 0 0 1-1.5 0v-6h-6a.75.75 0 1 1 0-1.5h6z" stroke="#FFF" fill="#FFF"/>
  </g>
</svg>`
  }

  // tslint:disable-next-line:cyclomatic-complexity
  private async buildLanguageSelector() {
    const { languageKey } = this.node.attrs

    const languageSelector = document.createElement('select')
    languageSelector.addEventListener('mousedown', event => {
      event.stopPropagation()
    })

    const { kernels } = await import('../lib/jupyter')

    if (this.parentFigureElement) {
      const textOption = document.createElement('option')
      textOption.textContent = 'Select a language…'
      textOption.setAttribute('value', 'null')
      textOption.setAttribute('disabled', 'disabled')
      if (!languageKey || languageKey === 'null') {
        textOption.setAttribute('selected', 'selected')
      }
      languageSelector.appendChild(textOption)

      for (const modeKey of Object.keys(kernels)) {
        const option = document.createElement('option')
        option.textContent = codemirrorModeLabels[modeKey as CodemirrorMode]
        option.setAttribute('value', modeKey)
        if (modeKey === languageKey) {
          option.setAttribute('selected', 'selected')
        }
        languageSelector.appendChild(option)
      }
    } else {
      const textOption = document.createElement('option')
      textOption.textContent = 'Plain Text'
      textOption.setAttribute('value', 'null')
      if (!languageKey || languageKey === 'null') {
        textOption.setAttribute('selected', 'selected')
      }
      languageSelector.appendChild(textOption)

      for (const [groupName, modes] of Object.entries(codemirrorModeGroups)) {
        const optgroup = document.createElement('optgroup')
        optgroup.setAttribute('label', groupName)

        for (const modeKey of modes) {
          const option = document.createElement('option')
          option.textContent = codemirrorModeLabels[modeKey]
          option.setAttribute('value', modeKey)
          if (modeKey === languageKey) {
            option.setAttribute('selected', 'selected')
          }
          optgroup.appendChild(option)
        }

        languageSelector.appendChild(optgroup)
      }
    }

    languageSelector.addEventListener('change', () => {
      const languageKey = languageSelector.value as CodemirrorMode

      this.editor.setOption(
        'mode',
        languageKey in codemirrorModeOptions
          ? codemirrorModeOptions[languageKey]
          : languageKey
      )
      this.refreshEditor()

      this.setNodeAttrs({ languageKey })
    })

    return languageSelector
  }

  private async createEditor(defaultPlaceholder: string = '<Listing>') {
    const { contents, languageKey, placeholder } = this.node.attrs

    const { createEditor } = await this.imports.codemirror

    this.editor = await createEditor({
      value: contents,
      mode:
        languageKey in codemirrorModeOptions
          ? codemirrorModeOptions[languageKey as CodemirrorMode]
          : languageKey,
      placeholder: placeholder || defaultPlaceholder,
      autofocus: false, // TODO: focus if this node is selected?
    })

    this.editor.on('changes', () => {
      const contents = this.editor.getValue()

      this.setNodeAttrs({ contents })
    })

    this.container.appendChild(this.editor.getWrapperElement())
    this.container.appendChild(await this.buildLanguageSelector())

    this.refreshEditor()
  }

  private refreshEditor() {
    window.requestAnimationFrame(() => {
      this.editor.refresh()
    })
  }

  private focusEditor() {
    window.requestAnimationFrame(() => {
      this.editor.focus()
    })
  }

  private setParentFigureElement = () => {
    const pos = this.getPos()
    const $pos = this.view.state.doc.resolve(pos)
    const parent = $pos.node($pos.depth)

    if (isFigureElementNode(parent)) {
      this.parentFigureElement = {
        node: parent,
        before: $pos.before($pos.depth - 1),
        start: $pos.start($pos.depth),
      }
    }
  }

  private toggleListing(isExpanded: boolean) {
    this.setNodeAttrs({ isExpanded })

    if (isExpanded) {
      this.refreshEditor()
      this.focusEditor()
    }
  }

  private setNodeAttrs(attrs: object) {
    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(this.getPos(), undefined, {
        ...this.node.attrs,
        ...attrs,
      })
    )
  }

  private showOutputs(outputs: Output[]) {
    this.outputNode.innerHTML = ''

    for (const output of outputs) {
      const item = document.createElement('div')
      // item.textContent = `${output.type}: ${output.text}`
      item.textContent = output.text
      item.className = `executable-output executable-output-${output.type}`
      this.outputNode.appendChild(item)
    }
  }

  private executeListing: EventListener = async event => {
    event.preventDefault()

    const { id, contents } = this.node.attrs

    // TODO: cancel existing execution?

    if (!contents) {
      return
    }

    this.setNodeAttrs({ isExecuting: true })

    const rxAttachments = await this.props.allAttachments(id)

    const attachments = await Promise.all(
      (rxAttachments || []).map(async attachment => {
        return {
          data: await attachment.getData(),
          mime: attachment.type,
          md5: attachment.digest,
          name: attachment.id,
        }
      })
    )

    const jupyter = await import('../lib/jupyter')
    const { KernelMessage } = await import('@jupyterlab/services')

    const outputs: Output[] = []
    this.showOutputs(outputs)

    const images: Array<{ value: string; type: string }> = []

    const addOutput = (output: Output) => {
      outputs.push(output)
      this.showOutputs(outputs)
    }

    // tslint:disable-next-line:cyclomatic-complexity
    const handleOutput = (
      message: import('@jupyterlab/services').KernelMessage.IIOPubMessage
    ) => {
      if (KernelMessage.isStreamMsg(message)) {
        const {
          content: { name, text },
        } = message

        addOutput({
          type: name,
          text,
        })
      } else if (KernelMessage.isDisplayDataMsg(message)) {
        const {
          content: { data },
        } = message

        for (const [type, value] of Object.entries(data)) {
          if (type.startsWith('image/')) {
            images.push({ value: String(value), type })
          }
        }

        if (data['text/plain']) {
          const text = String(data['text/plain'])

          addOutput({
            type: 'display',
            text: `Output: ${text}`,
          })
        }
      } else if (KernelMessage.isErrorMsg(message)) {
        const {
          content: { ename, evalue },
        } = message

        addOutput({
          type: 'error',
          text: `${ename || 'Error'}: ${evalue}`,
        })
      }
    }

    // TODO: use hash?
    try {
      await jupyter.executeKernel(
        this.props.jupyterConfig,
        id,
        attachments,
        contents,
        this.node.attrs.languageKey as CodemirrorMode,
        handleOutput
      )
    } catch (error) {
      addOutput({
        type: 'error',
        text: error.message,
      })
    }

    if (images.length > 0) {
      // use the last item
      const image = images.pop()!
      await this.handleOutputData(image.value, image.type)
    }

    const hasError = outputs.some(output => output.type === 'error')

    if (!hasError) {
      addOutput({
        type: 'status',
        text: '🚀Finished!',
      })
    }

    this.setNodeAttrs({ isExecuting: false })
  }

  private handleOutputData = async (data: string, contentType: string) => {
    const blob = base64StringToBlob(data, contentType)

    const attachmentKey = 'result' // TODO: what should this be, can there be more than one?

    await this.props.putAttachment(this.node.attrs.id, {
      id: attachmentKey,
      data: blob,
      type: blob.type,
    })

    const src = window.URL.createObjectURL(blob)

    // // update figures/tables that refer to this listing + attachment
    // // TODO: only look inside the parent figure_element?
    // this.view.state.doc.descendants((node, pos) => {
    //   const { listingAttachment } = node.attrs
    //
    //   if (
    //     listingAttachment &&
    //     listingAttachment.listingID === this.node.attrs.id &&
    //     listingAttachment.attachmentKey === attachmentKey
    //   ) {
    //    this.setNodeAttrs({ src })
    //   }
    // })

    const figureType = this.view.state.schema.nodes.figure

    this.parentFigureElement!.node.forEach((node, pos) => {
      if (node.type === figureType) {
        this.view.dispatch(
          this.view.state.tr.setNodeMarkup(
            this.parentFigureElement!.start + pos,
            undefined,
            {
              ...node.attrs,
              listingAttachment: {
                listingID: this.node.attrs.id,
                attachmentKey,
              },
              src,
              contentType: blob.type,
            }
          )
        )
      }
    })
  }

  private attachListingData = () => {
    const { id } = this.node.attrs

    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.accept = '*/*'
      input.type = 'file'
      input.multiple = true

      input.addEventListener<'change'>('change', async event => {
        const target = event.target as HTMLInputElement

        if (!target.files) {
          return
        }

        for (const file of target.files) {
          await this.props.putAttachment(id, {
            data: file,
            id: file.name,
            type: file.type,
          })
        }

        resolve()
      })

      input.click()
    })
  }
}

const listing = (props: EditorProps): NodeViewCreator => (node, view, getPos) =>
  new Listing(props, node, view, getPos)

export default listing
