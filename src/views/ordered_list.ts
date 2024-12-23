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

import { ListElement } from '@manuscripts/json-schema'
import { ListNode, ManuscriptNode } from '@manuscripts/transform'

import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeOrElementView } from './creators'

export type JatsStyleType = NonNullable<ListElement['listStyleType']>

export const JATS_HTML_LIST_STYLE_MAPPING: {
  [key in JatsStyleType]: string
} = {
  simple: 'none',
  bullet: 'disc',
  order: 'decimal',
  'alpha-lower': 'lower-alpha',
  'alpha-upper': 'upper-alpha',
  'roman-lower': 'lower-roman',
  'roman-upper': 'upper-roman',
}

export class OrderedListView extends BlockView<Trackable<ListNode>> {
  public elementType = 'ol'

  public updateContents() {
    super.updateContents()
    if (this.contentDOM) {
      const type = (this.node.attrs.listStyleType as JatsStyleType) || 'order'
      this.contentDOM.style.listStyleType = JATS_HTML_LIST_STYLE_MAPPING[type]
    }
  }
}

export const orderedListCallback = (node: ManuscriptNode, dom: HTMLElement) => {
  dom.classList.add('list')
  const type = (node.attrs.listStyleType as JatsStyleType) || 'order'
  dom.style.listStyleType = JATS_HTML_LIST_STYLE_MAPPING[type]
}

export default createNodeOrElementView(
  OrderedListView,
  'ol',
  orderedListCallback
)
