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

import { ManuscriptNode } from '@manuscripts/manuscript-transform'
import { NodeView } from 'prosemirror-view'
import { placeholderContent } from '../lib/placeholder'
import { NodeViewCreator } from '../types'

class Placeholder implements NodeView {
  public dom: HTMLElement
  private node: ManuscriptNode

  constructor(node: ManuscriptNode) {
    this.node = node

    this.initialise()
  }

  private initialise() {
    this.dom = document.createElement('div')
    this.dom.classList.add('placeholder-item')
    this.dom.innerHTML = placeholderContent(
      this.node.attrs.label,
      'support@manuscriptsapp.com'
    )
  }
}

const placeholder: NodeViewCreator = node => new Placeholder(node)

export default placeholder
