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

import { FootnoteNode, ManuscriptNode } from '@manuscripts/transform'

import { getChangeClasses } from '../lib/track-changes-utils'
import BlockView from './block_view'
import { createNodeOrElementView } from './creators'

export class FootnoteView extends BlockView<FootnoteNode> {
  public elementType = 'div'
}

export const setTCClasses = (node: ManuscriptNode, dom: HTMLElement) => {
  const dataTracked = node.attrs.dataTracked
  if (dataTracked?.length) {
    const lastChange = dataTracked[dataTracked.length - 1]
    const changeClasses = getChangeClasses([lastChange])
    dom.classList.add(...changeClasses)
  }
  dom.setAttribute('id', node.attrs.id)
}

export default createNodeOrElementView(FootnoteView, 'div', setTCClasses)
