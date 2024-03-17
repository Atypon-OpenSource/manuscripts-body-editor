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

import { schema } from '@manuscripts/transform'

import { getChangeClasses } from '../lib/track-changes-utils'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class FootnotesElementView<
  PropsType extends BaseNodeProps
> extends BlockView<PropsType> {
  public elementType = 'div'

  public updateContents = () => {
    const $pos = this.view.state.doc.resolve(this.getPos())
    if ($pos.parent.type === schema.nodes.table_element_footer) {
      // To set TC classes and discard any other classes related to the block view.
      this.setTCClasses()
    }
  }

  onUpdateContent() {
    this.checkEditability()
  }

  checkEditability = () => {
    const editable = this.node.childCount ? 'true' : 'false'
    this.contentDOM?.setAttribute('contenteditable', editable)
    this.dom?.setAttribute('contenteditable', editable)
  }

  setTCClasses = () => {
    const classNames = ['footnote-element']
    const dataTracked = this.node.attrs.dataTracked
    if (dataTracked?.length) {
      const lastChange = dataTracked[dataTracked.length - 1]
      const changeClasses = getChangeClasses([lastChange])
      classNames.push(...changeClasses)
    }
    this.dom.className = classNames.join(' ')
  }
}

export default createNodeView(FootnotesElementView)
