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

import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeOrElementView } from './creators'
import { setTCClasses } from './footnote'

export class FootnotesElementView<
  PropsType extends BaseNodeProps
> extends BlockView<PropsType> {
  public elementType = 'div'

  onUpdateContent() {
    this.checkEditability()
  }

  checkEditability = () => {
    const editable = this.node.childCount ? 'true' : 'false'
    this.contentDOM?.setAttribute('contenteditable', editable)
    this.dom?.setAttribute('contenteditable', editable)
  }
}

export default createNodeOrElementView(
  FootnotesElementView,
  'div',
  setTCClasses
)
