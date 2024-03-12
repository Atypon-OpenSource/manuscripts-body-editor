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

// import { getChangeClasses } from '../lib/track-changes-utils'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeOrElementView } from './creators'

export class FootnotesElementView<
  PropsType extends BaseNodeProps
> extends BlockView<PropsType> {
  public elementType = 'div'

  // The attempt to use this method failed because the footnote element in the table footer was created as a DIV element view instead of using this node view. Consequently, it doesn't trigger this updateContents function.

  // One potential solution is to replace 'createNodeOrElementView' with 'createNodeView'. However, this change will alter the DOM structure of the table footer, potentially introducing additional elements related to block views. Therefore, additional effort will be required to ensure the correct display of the table footer.

  // public updateContents = () => {
  //   const dataTracked = this.node.attrs.dataTracked
  //   if (dataTracked?.length) {
  //     const lastChange = dataTracked[dataTracked.length - 1]
  //     const classes = getChangeClasses([lastChange])
  //     this.dom.className = ['footnote-element', ...classes].join(' ')

  //   }
  // }

  onUpdateContent() {
    this.checkEditability()
  }

  checkEditability = () => {
    const editable = this.node.childCount ? 'true' : 'false'
    this.contentDOM?.setAttribute('contenteditable', editable)
    this.dom?.setAttribute('contenteditable', editable)
  }
}

export default createNodeOrElementView(FootnotesElementView, 'div')
