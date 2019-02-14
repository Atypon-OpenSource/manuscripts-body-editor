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
import { NodeView } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { CodeMirrorCreator } from '../lib/codemirror'
import { NodeViewCreator } from '../types'

// TODO: inline code editor

class Listing implements NodeView {
  public dom: HTMLElement

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
    this.props.popper.update()
    return true
  }

  public async selectNode() {
    // dom.classList.add('ProseMirror-selectednode')

    const { createEditor } = await this.imports.codemirror

    // TODO: this.node.attrs.languageKey
    const input = await createEditor(this.node.attrs.contents, 'javascript')

    // input.className = 'code-editor'

    input.on('changes', async () => {
      const contents = input.getValue()

      const tr = this.view.state.tr
        .setNodeMarkup(this.getPos(), undefined, {
          ...this.node.attrs,
          contents,
        })
        .setSelection(this.view.state.selection)

      this.view.dispatch(tr)
    })

    this.props.popper.show(this.dom, input.getWrapperElement(), 'bottom')

    window.requestAnimationFrame(() => {
      input.refresh()
      input.focus()
    })

    // dom.classList.add('ProseMirror-selectednode')
  }

  public deselectNode() {
    this.props.popper.destroy()
    // dom.classList.remove('ProseMirror-selectednode')
  }

  public stopEvent(event: Event) {
    return event.type !== 'mousedown' && !event.type.startsWith('drag')
  }

  public ignoreMutation() {
    return true
  }

  protected get elementType() {
    return 'pre'
  }

  protected updateContents() {
    const { contents } = this.node.attrs

    if (contents) {
      this.dom.textContent = this.node.attrs.contents
    } else {
      while (this.dom.hasChildNodes()) {
        this.dom.removeChild(this.dom.firstChild!)
      }

      const placeholder = document.createElement('div')
      placeholder.className = 'code-placeholder'
      placeholder.textContent = this.node.attrs.placeholder || '<Listing>'
      this.dom.appendChild(placeholder)
    }
  }

  protected createDOM() {
    this.dom = document.createElement(this.elementType)
    this.dom.classList.add('listing')
  }
}

const listing = (props: EditorProps): NodeViewCreator => (node, view, getPos) =>
  new Listing(props, node, view, getPos)

export default listing
