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

import { ListItemNode, ManuscriptNode } from '@manuscripts/transform'

import { getChangeClasses } from '../lib/track-changes-utils'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeOrElementView } from './creators'

export class ListItemView<PropsType extends BaseNodeProps> extends BlockView<
  PropsType,
  ListItemNode
> {
  public elementType = 'li'
}

export const listItemCallback = (node: ManuscriptNode, dom: HTMLElement) => {
  if (node.attrs.dataTracked) {
    const classes = getChangeClasses(node.attrs.dataTracked)
    dom.className = classes.join(' ')
  }
}

export default createNodeOrElementView(ListItemView, 'li', listItemCallback)
