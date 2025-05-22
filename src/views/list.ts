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

import { ListNode, ListStyleType, ManuscriptNode } from '@manuscripts/transform'

import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeOrElementView } from './creators'
import { EditableBlock } from './editable_block'

export class ListView extends BlockView<Trackable<ListNode>> {
  public elementType = 'ul'

  public updateContents() {
    super.updateContents()
    if (this.contentDOM) {
      const type = this.node.attrs.listStyleType
      this.contentDOM.style.listStyleType = getCssListStyleType(type)
    }
  }
}

export const listCallback = (node: ManuscriptNode, dom: HTMLElement) => {
  dom.classList.add('list')
  const type = node.attrs.listStyleType
  dom.style.listStyleType = getCssListStyleType(type)
}
export default createNodeOrElementView(
  EditableBlock(ListView),
  'ul',
  listCallback
)

export const getCssListStyleType = (type: ListStyleType) => {
  switch (type) {
    case 'bullet':
      return 'disc'
    case 'order':
      return 'decimal'
    case 'alpha-lower':
      return 'lower-alpha'
    case 'alpha-upper':
      return 'upper-alpha'
    case 'roman-lower':
      return 'lower-roman'
    case 'roman-upper':
      return 'upper-roman'
    case 'simple':
      return 'none'
  }
}
