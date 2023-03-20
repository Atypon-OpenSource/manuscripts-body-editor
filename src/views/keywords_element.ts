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

// import { BaseNodeProps } from './base_node_view'
import { Manuscript, Model, Section } from '@manuscripts/json-schema'
import { Build } from '@manuscripts/transform'

import { Dispatch } from '../commands'
import { AddKeywordInline } from '../components/keywords/AddKeywordInline'
import { AnyElement } from '../components/keywords/ElementStyle'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNonEditableNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'

export interface KeywordsElementProps {
  modelMap: Map<string, Model>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  dispatch?: Dispatch
}

export class KeywordsElementView extends BlockView<
  BaseNodeProps & EditableBlockProps & KeywordsElementProps
> {
  private element: HTMLElement
  public editingTools: HTMLDivElement

  public ignoreMutation = () => true

  public stopEvent = () => true

  public createElement = () => {
    this.element = document.createElement('div')
    this.element.classList.add('block')
    this.dom.appendChild(this.element)

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('keywords-list')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.contentDOM.setAttribute('contenteditable', 'false')

    this.element.appendChild(this.contentDOM)
    const modelMapArray = Array.from(this.props.modelMap, function (entry) {
      return entry[1]
    })
    const target: AnyElement | Section | Manuscript = modelMapArray.find(
      (model) => {
        return model.objectType === 'MPManuscript'
      }
    ) as Manuscript

    const componentProps = {
      props: {
        modelMap: this.props.modelMap,
        saveModel: this.props.saveModel,
        target,
        keywordsListElement: this.contentDOM,
      },
    }

    this.editingTools = ReactSubView(
      this.props,
      AddKeywordInline,
      componentProps,
      this.node,
      this.getPos,
      this.view,
      'keywords-editor'
    )

    if (this.editingTools) {
      this.element.appendChild(this.editingTools)
    }
  }
}

export default createNonEditableNodeView(KeywordsElementView)
