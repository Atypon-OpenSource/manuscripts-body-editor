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

import { NodeSelection } from 'prosemirror-state'

import { createEditableNodeView } from './creators'
import { EquationView } from './equation'

export class EquationEditableView extends EquationView {
  public selectNode = async () => {
    if (!this.props.getCapabilities().editArticle) {
      return
    }

    const { createEditor } = await import('../lib/codemirror')

    const placeholder = 'Enter LaTeX equation, e.g. "a^2 = \\sqrt{b^2 + c^2}"'

    const input = await createEditor({
      value: this.node.attrs.contents || '',
      mode: 'stex',
      placeholder,
      autofocus: true,
      extraKeys: {
        Esc: () => {
          this.props.popper.destroy()
          this.view.focus()
        },
      },
    })

    input.on('changes', async () => {
      const contents = input.getValue()

      const pos = this.getPos()

      const { tr } = this.view.state

      const format = contents.includes('mml:math') ? 'mathml' : 'tex'
      tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        contents,
        format,
      }).setSelection(NodeSelection.create(tr.doc, pos))

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
  }
}

export default createEditableNodeView(EquationEditableView)
