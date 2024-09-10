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

import { CitationNode, ManuscriptNodeView } from '@manuscripts/transform'
import { DOMSerializer } from 'prosemirror-model'

import { sanitize } from '../lib/dompurify'
import { getChangeClasses } from '../lib/track-changes-utils'
import { getBibliographyPluginState } from '../plugins/bibliography'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import { Trackable } from '../types'

export class CitationView<PropsType extends BaseNodeProps>
  extends BaseNodeView<PropsType, Trackable<CitationNode>>
  implements ManuscriptNodeView
{
  public ignoreMutation = () => true

  public initialise = () => {
    if (!this.node.type.spec.toDOM) {
      throw Error(`Node view ${this.node.type} doesn't have toDOM method`)
    }
    const outputSpec = this.node.type.spec.toDOM(this.node)
    const { dom, contentDOM } = DOMSerializer.renderSpec(document, outputSpec)
    this.dom = dom as HTMLElement
    this.dom.className = 'citation-wrapper'
    this.contentDOM = (contentDOM as HTMLElement) || undefined
    this.eventHandlers()
    this.updateContents()
    return this
  }

  public updateContents = () => {
    const bib = getBibliographyPluginState(this.view.state)

    if (!bib) {
      return
    }

    const id = this.node.attrs.id
    const element = document.createElement('span')
    element.id = id
    element.classList.add('citation')
    if (this.node.attrs.dataTracked?.length) {
      const change = this.node.attrs.dataTracked[0]
      element.setAttribute('data-track-id', change.id)
      element.setAttribute('data-track-status', change.status)
      element.setAttribute('data-track-op', change.operation)
      element.classList.add(...getChangeClasses([change]))
    }

    const text = bib.renderedCitations.get(id)
    const fragment = sanitize(
      text && text !== '[NO_PRINTED_FORM]' ? text : ' ',
      {
        ALLOWED_TAGS: ['i', 'b', 'span', 'sup', 'sub', '#text'],
      }
    )
    element.appendChild(fragment)
    this.dom.innerHTML = ''
    this.dom.appendChild(element)
    this.setDomAttrs(this.node, this.dom, ['rids', 'contents', 'selectedText'])
  }
  public eventHandlers: () => void
}

export default createNodeView(CitationView)
