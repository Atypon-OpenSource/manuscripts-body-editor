/*!
 * © 2026 Atypon Systems LLC
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

import { AttributionNode, ManuscriptNode, schema } from '@manuscripts/transform'
import { TextSelection } from 'prosemirror-state'

import { createKeyboardInteraction } from '../lib/navigation-utils'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

const isQuoteNode = (node: ManuscriptNode) =>
  node.type === schema.nodes.pullquote_element ||
  node.type === schema.nodes.blockquote_element

export class AttributionView extends BaseNodeView<AttributionNode> {
  private removeKeydownListener?: () => void

  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  protected createDOM() {
    this.dom = document.createElement('div')
    this.addLabel()
    this.contentDOM = this.dom
  }

  private addLabel() {
    const $pos = this.view.state.doc.resolve(this.getPos())
    if (!isQuoteNode($pos.parent)) {
      this.dom.className = 'attribution'
      this.dom.tabIndex = 0
      this.dom.setAttribute('element-label', 'Credit')
      this.removeKeydownListener = createKeyboardInteraction({
        container: this.dom,
        additionalKeys: {
          Enter: (e) => {
            e.preventDefault()
            const pos = this.getPos()
            const tr = this.view.state.tr.setSelection(
              TextSelection.create(this.view.state.doc, pos + 1)
            )
            this.view.dispatch(tr)
            this.view.focus()
          },
        },
      })
    }
  }

  public destroy() {
    this.removeKeydownListener?.()
    super.destroy()
  }
}

export default createNodeView(AttributionView)
