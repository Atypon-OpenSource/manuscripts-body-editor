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

import { sanitize } from '../lib/dompurify'
import { getBibliographyPluginState } from '../plugins/bibliography'
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class CitationView
  extends BaseNodeView<Trackable<CitationNode>>
  implements ManuscriptNodeView
{
  public ignoreMutation = () => true

  public initialise() {
    this.createDOM()
    this.updateContents()
  }

  public createDOM() {
    this.dom = document.createElement('span')
    this.dom.classList.add('citation')
    this.dom.tabIndex = 0
  }

  public updateContents() {
    super.updateContents()
    const bib = getBibliographyPluginState(this.view.state)

    if (!bib) {
      return
    }

    const id = this.node.attrs.id
    const text = bib.renderedCitations.get(id)
    const fragment = sanitize(
      text === '(n.d.)'
        ? 'Missing citation data'
        : text && text !== '[NO_PRINTED_FORM]'
          ? text
          : ' ',
      {
        ALLOWED_TAGS: ['i', 'b', 'span', 'sup', 'sub', '#text'],
      }
    )
    this.dom.innerHTML = ''
    this.dom.appendChild(fragment)
  }
}

export default createNodeView(CitationView)
