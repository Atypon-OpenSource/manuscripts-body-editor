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

import { ListNode, ManuscriptNode } from '@manuscripts/transform'

import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeOrElementView } from './creators'
import { JATS_HTML_LIST_STYLE_MAPPING, JatsStyleType } from './ordered_list'

export class BulletListView extends BlockView<Trackable<ListNode>> {
  public elementType = 'ul'

  public updateContents() {
    super.updateContents()
    if (this.contentDOM) {
      const type = (this.node.attrs.listStyleType as JatsStyleType) || 'bullet'
      this.contentDOM.style.listStyleType = JATS_HTML_LIST_STYLE_MAPPING[type]
    }
  }
}

export const bulletListCallback = (node: ManuscriptNode, dom: HTMLElement) => {
  const type = (node.attrs.listStyleType as JatsStyleType) || 'bullet'
  dom.style.listStyleType = JATS_HTML_LIST_STYLE_MAPPING[type]
}

export default createNodeOrElementView(BulletListView, 'ul', bulletListCallback)
