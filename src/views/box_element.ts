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

import {ManuscriptNode} from '@manuscripts/transform'
import {createEditableNodeView} from './creators'
import BlockView from "./block_view";
import {EditableBlock} from "./editable_block";

export class BoxElementView extends BlockView<ManuscriptNode> {
  public elementType = 'div'

  public createElement = () => {
    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.className = 'block box-element'
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.dom.appendChild(this.contentDOM)
  }

}


export default createEditableNodeView(EditableBlock(BoxElementView))
