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

import { ManuscriptNodeView } from '@manuscripts/transform'
import { DOMSerializer } from 'prosemirror-model'

import { sanitize } from '../lib/dompurify'
import { getChangeClasses } from '../lib/track-changes-utils'
import { getBibliographyPluginState } from '../plugins/bibliography'
import { addCommentToLeafNode } from '../plugins/comment_annotation'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class CitationView<PropsType extends BaseNodeProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public ignoreMutation = () => true
  wasUpdated = false

  public initialise = () => {
    if (!this.node.type.spec.toDOM) {
      throw Error(`Node view ${this.node.type} doesn't have toDOM method`)
    }
    const outputSpec = this.node.type.spec.toDOM(this.node)
    const { dom, contentDOM } = DOMSerializer.renderSpec(document, outputSpec)
    this.dom = dom as HTMLElement
    this.contentDOM = (contentDOM as HTMLElement) || undefined
    this.updateContents()
    return this
  }

  public updateContents = () => {
    console.log('citation view updateContents')
    const bib = getBibliographyPluginState(this.view.state)

    if (!bib) {
      return
    }

    const element = document.createElement('span')
    element.classList.add('citation')
    if (this.node.attrs.dataTracked?.length) {
      element.classList.add(...getChangeClasses(this.node.attrs.dataTracked))
      element.dataset.trackId = this.node.attrs.dataTracked[0].id
    }

    const text = bib.renderedCitations.get(this.node.attrs.id)
    const fragment = sanitize(
      text && text !== '[NO_PRINTED_FORM]' ? text : ' ',
      {
        ALLOWED_TAGS: ['i', 'b', 'span', 'sup', 'sub', '#text'],
      }
    )
    element.appendChild(fragment)
    this.dom.className = 'citation-wrapper'
    this.dom.innerHTML = ''
    this.dom.appendChild(element)
    addCommentToLeafNode(
      this.getPos(),
      this.getPos() + this.node.nodeSize,
      this.view.state,
      this.dom
    )

    this.setDomAttrs(this.node, this.dom, ['rids', 'contents', 'selectedText'])

    if (!this.wasUpdated) {
      // to have only one event listener
      this.dom.addEventListener('click', () => this.onClickHandler())
    }
    this.wasUpdated = true
  }

  public onClickHandler = () => {
    // extend this
  }
}

export default createNodeView(CitationView)
