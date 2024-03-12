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

import { ManuscriptNodeView, schema } from '@manuscripts/transform'

import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import { TrackedAttrs } from '@manuscripts/track-changes-plugin'
import { getChangeClasses } from '../lib/track-changes-utils'
import { findChildrenByType } from 'prosemirror-utils'

export class TableElementFooterView<PropsType extends BaseNodeProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public initialise = () => {
    this.createDOM()
  }

  public createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('table-footer')
    this.dom.setAttribute('id', this.node.attrs.id)
    this.contentDOM = document.createElement('div')
    this.dom.appendChild(this.contentDOM)
  }

  // This alternative solution does work, but sometimes I noticed that while it successfully sets the class name directly after any change (approve, reject, etc.), the style isn't reflected until I click on the editing area. This behavior seems unusual to me, although it doesn't occur consistently.

  public updateContents = async () => {
    if (!this.contentDOM) {
      return
    }
    const footnoteElement = this.contentDOM.querySelector('.footnote-element')
    if (footnoteElement) {
      const footnoteElementNode = findChildrenByType(
        this.node,
        schema.nodes.footnotes_element
      )[0].node

      const dataTracked = footnoteElementNode.attrs
        .dataTracked as TrackedAttrs[]
      if (footnoteElementNode && dataTracked?.length) {
        const lastChange = dataTracked[dataTracked.length - 1]
        const classes = getChangeClasses([lastChange])
        footnoteElement.className = ['footnote-element', ...classes].join(' ')
      }
    }
  }
}
export default createNodeView(TableElementFooterView)
