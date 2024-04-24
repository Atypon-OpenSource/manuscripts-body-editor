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

import { AddKeywordInline } from '../components/keywords/AddKeywordInline'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'

export class KeywordGroupView extends BlockView<EditableBlockProps> {
  private element: HTMLElement
  private addingTools: HTMLDivElement

  public ignoreMutation = () => true

  public stopEvent = () => true

  public createElement = () => {
    this.element = document.createElement('div')
    this.element.classList.add('block', 'keyword-group-container')
    this.dom.appendChild(this.element)

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('keyword-group')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.contentDOM.setAttribute('contenteditable', 'false')

    this.element.appendChild(this.contentDOM)

    if (this.props.getCapabilities().editArticle) {
      this.addingTools = ReactSubView(
        this.props,
        AddKeywordInline,
        { getUpdatedNode: () => this.node },
        this.node,
        this.getPos,
        this.view,
        'keywords-editor'
      )
    }

    if (this.addingTools) {
      this.element.appendChild(this.addingTools)
    }
  }

  public updateContents = () => {
    this.dom.addEventListener('click', (event) => this.onClickHandler(event))
  }

  private onClickHandler = (event: MouseEvent) => {
    event?.stopPropagation()
    const { tr, doc } = this.view.state
    tr.setSelection(NodeSelection.create(doc, this.getPos()))
    this.view.dispatch(tr)
  }
}

export default createNodeView(KeywordGroupView)
