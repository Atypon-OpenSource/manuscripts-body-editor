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
  xmlSerializer,
} from '@manuscripts/manuscript-transform'
import { NodeView } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { NodeViewCreator } from '../types'

class Equation implements NodeView {
  public dom: HTMLElement

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

    const { createEditor } = await import('../lib/codemirror')
    const { typeset } = await import('../lib/mathjax')

    const placeholder = 'Enter LaTeX equation, e.g. "a^2 = \\sqrt{b^2 + c^2}"'

    const input = await createEditor({
      value: this.node.attrs.TeXRepresentation || '',
      mode: 'stex',
      placeholder,
      autofocus: true,
    })

    input.on('changes', async () => {
      const TeXRepresentation = input.getValue()

      const typesetRoot = typeset(TeXRepresentation, true)

      if (!typesetRoot || !typesetRoot.firstChild) {
        throw new Error('No SVG output from MathJax')
      }

      const SVGStringRepresentation = xmlSerializer.serializeToString(
        typesetRoot.firstChild
      )

      const tr = this.view.state.tr
        .setNodeMarkup(this.getPos(), undefined, {
          ...this.node.attrs,
          TeXRepresentation,
          SVGStringRepresentation,
        })
        .setSelection(this.view.state.selection)

      this.view.dispatch(tr)
    })

    const wrapper = document.createElement('div')
    wrapper.appendChild(input.getWrapperElement())
    wrapper.className = 'equation-editor'

    const infoLink = document.createElement('a')
    infoLink.target = '_blank'
    infoLink.textContent = '?'
    infoLink.title = ''
    infoLink.href = 'https://en.wikibooks.org/wiki/LaTeX/Mathematics#Symbols'
    infoLink.className = 'equation-editor-info'

    wrapper.appendChild(infoLink)

    this.props.popper.show(this.dom, wrapper, 'bottom')

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
    return 'div'
  }

  protected updateContents() {
    const { SVGStringRepresentation } = this.node.attrs

    if (SVGStringRepresentation) {
      this.dom.innerHTML = SVGStringRepresentation // TODO: sanitize!
    } else {
      while (this.dom.hasChildNodes()) {
        this.dom.removeChild(this.dom.firstChild!)
      }

      const placeholder = document.createElement('div')
      placeholder.className = 'equation-placeholder'
      placeholder.textContent = '<Equation>'

      this.dom.appendChild(placeholder)
    }
  }

  protected createDOM() {
    this.dom = document.createElement(this.elementType)
    this.dom.classList.add('equation')
  }
}

const equation = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new Equation(props, node, view, getPos)

export default equation
