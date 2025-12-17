/*!
 * © 2025 Atypon Systems LLC
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

import { CaptionTitleNode } from '@manuscripts/transform'

import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class CaptionTitleView extends BaseNodeView<CaptionTitleNode> {
  public initialise = () => {
    this.createDOM()
  }
  protected createDOM() {
    this.dom = document.createElement('caption')
    this.dom.className = 'caption-title placeholder'
    this.dom.contentEditable = 'true'
    this.contentDOM = this.dom
  }
}
export default createNodeView(CaptionTitleView)
