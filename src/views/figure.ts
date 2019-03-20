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
  ManuscriptEditorView,
  ManuscriptNode,
} from '@manuscripts/manuscript-transform'
import { Decoration, NodeView } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { NodeViewCreator } from '../types'

class FigureBlock implements NodeView {
  public dom: HTMLElement
  public contentDOM: HTMLElement
  private container: HTMLElement

  private readonly props: EditorProps
  private readonly getPos: () => number
  private node: ManuscriptNode
  private readonly view: ManuscriptEditorView

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

    this.createDOM()
    this.updateContents()
  }

  // TODO: does this need to be different?
  public update(newNode: ManuscriptNode, decorations?: Decoration[]): boolean {
    if (newNode.type.name !== this.node.type.name) return false
    if (newNode.attrs.id !== this.node.attrs.id) return false
    this.node = newNode
    this.updateContents()
    return true
  }

  public selectNode() {
    this.dom.classList.add('ProseMirror-selectednode')
  }

  public deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode')
  }

  public stopEvent(event: Event) {
    return (
      event.type !== 'mousedown' &&
      !event.type.startsWith('drop') &&
      !event.type.startsWith('drag')
    )
  }

  public ignoreMutation() {
    return true
  }

  protected get elementType() {
    return 'figure'
  }

  // TODO: load/subscribe to the figure style object from the database and use it here?
  protected createDOM() {
    this.dom = document.createElement(this.elementType)
    this.dom.setAttribute('id', this.node.attrs.id)

    this.container = document.createElement('div')
    this.container.className = 'figure'
    this.container.contentEditable = 'false'
    this.dom.appendChild(this.container)

    this.contentDOM = document.createElement('div') // TODO: figcaption?
    this.contentDOM.className = 'figure-caption'
    this.dom.appendChild(this.contentDOM)
  }

  protected updateContents() {
    const { src } = this.node.attrs

    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.firstChild as Node)
    }

    const input = document.createElement('input')
    input.accept = 'image/*'
    input.type = 'file'
    input.addEventListener<'change'>('change', async event => {
      const target = event.target as HTMLInputElement

      if (target.files && target.files.length) {
        await this.updateFigure(target.files[0])
      }
    })

    const img = src
      ? this.createFigureImage(src)
      : this.createFigurePlaceholder()

    img.addEventListener<'click'>('click', () => {
      input.click()
    })

    img.addEventListener<'mouseenter'>('mouseenter', () => {
      img.classList.toggle('over', true)
    })

    img.addEventListener<'mouseleave'>('mouseleave', () => {
      img.classList.toggle('over', false)
    })

    img.addEventListener<'dragenter'>('dragenter', () => {
      img.classList.toggle('over', true)
    })

    img.addEventListener<'dragleave'>('dragleave', () => {
      img.classList.toggle('over', false)
    })

    img.addEventListener<'dragover'>('dragover', event => {
      event.preventDefault()
    })

    // img.addEventListener<'drop'>('drop', this.handleDrop(index))

    // TODO: a popup editor for figure contents and metadata?

    this.container.appendChild(img)
  }

  // private handleDrop(index: number) {
  //   return (event: DragEvent) => {
  //     event.preventDefault()
  //
  //     if (event.dataTransfer && event.dataTransfer.files) {
  //       Array.from(event.dataTransfer.files).forEach((file, fileIndex) => {
  //         this.addImage(file, index + fileIndex)
  //       })
  //     }
  //   }
  // }

  private createFigureImage(src: string) {
    const element = document.createElement('img')
    element.classList.add('figure-image')
    element.src = src

    return element
  }

  private createFigurePlaceholder() {
    const element = document.createElement('div')
    element.classList.add('figure')
    element.classList.add('placeholder')

    const instructions = document.createElement('div')
    instructions.textContent = 'Click to select an image file'
    element.appendChild(instructions)

    return element
  }

  private async updateFigure(file: File) {
    const { id } = this.node.attrs

    const attachment = await this.props.putAttachment(id, {
      id: 'image',
      type: file.type,
      data: file,
    })

    const blob = await attachment.getData()
    const src = window.URL.createObjectURL(blob)

    this.view.dispatch(
      this.view.state.tr
        .setNodeMarkup(this.getPos(), undefined, {
          ...this.node.attrs,
          src,
          contentType: file.type,
        })
        .setSelection(this.view.state.selection)
    )
  }
}

const figure = (props: EditorProps): NodeViewCreator => (node, view, getPos) =>
  new FigureBlock(props, node, view, getPos)

export default figure
