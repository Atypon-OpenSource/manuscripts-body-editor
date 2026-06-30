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

import {
  HeadshotElementNode,
  HeadshotGridNode,
  schema,
} from '@manuscripts/transform'
import { TextSelection } from 'prosemirror-state'

import { addAuthorIcon } from '../icons'
import {
  createKeyboardInteraction,
  handleEnterKey,
} from '../lib/navigation-utils'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class HeadshotGridView extends BlockView<HeadshotGridNode> {
  public elementType = 'div'
  private container: HTMLElement
  private addHeadshotButton: HTMLElement
  private removeKeydownListener?: () => void

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block', 'headshot-grid-container')
    this.dom.appendChild(this.container)

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('headshot-grid-block')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.removeKeydownListener = createKeyboardInteraction({
      container: this.contentDOM,
      navigation: {
        arrowKeys: { forward: 'ArrowDown', backward: 'ArrowUp' },
        getItems: () => [...(this.contentDOM?.children || [])] as HTMLElement[],
      },
    })
    this.container.appendChild(this.contentDOM)

    const can = this.props.getCapabilities()

    if (can.editArticle) {
      this.addHeadshotButton = document.createElement('button')
      this.addHeadshotButton.classList.add('add-headshot-element-button')
      this.addHeadshotButton.setAttribute('data-cy', 'headshot-add')
      this.addHeadshotButton.contentEditable = 'false'
      this.addHeadshotButton.innerHTML = addAuthorIcon
      const buttonText = document.createElement('span')
      buttonText.classList.add('add-headshot-element-text')
      buttonText.innerText = 'Add Headshot'
      this.addHeadshotButton.appendChild(buttonText)
      this.addHeadshotButton.addEventListener('click', this.handleAddHeadshot)
      this.addHeadshotButton.addEventListener(
        'keydown',
        handleEnterKey(this.handleAddHeadshot)
      )
      this.container.appendChild(this.addHeadshotButton)
    }

    this.dom.appendChild(this.container)
  }

  private handleAddHeadshot = () => {
    const { state, dispatch } = this.view
    const { tr } = state

    const headshotElementNode =
      schema.nodes.headshot_element.createAndFill() as HeadshotElementNode
    const insertPos = this.getPos() + 1
    tr.insert(insertPos, headshotElementNode)
    this.view.focus()
    tr.setSelection(TextSelection.create(tr.doc, insertPos))
    dispatch(tr.scrollIntoView())
  }

  public destroy() {
    this.addHeadshotButton?.removeEventListener('click', this.handleAddHeadshot)
    this.removeKeydownListener?.()
    super.destroy()
  }
}

export default createNodeView(HeadshotGridView)
