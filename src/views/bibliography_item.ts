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

import {
  CitationProvider,
  createBibliographyElementContents,
  loadCitationStyle,
} from '@manuscripts/library'
import {
  DEFAULT_BUNDLE,
  ManuscriptNodeView,
} from '@manuscripts/manuscript-transform'
import { BibliographyItem } from '@manuscripts/manuscripts-json-schema'
import { sanitize } from '../lib/dompurify'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

const createBibliography = async (items: BibliographyItem[]) => {
  console.log('create bibliography')
  const styleOpts = { bundleID: DEFAULT_BUNDLE }
  const citationStyle = await loadCitationStyle(styleOpts)
  const [
    bibmeta,
    bibliographyItems,
  ] = CitationProvider.makeBibliographyFromCitations(items, citationStyle)

  if (bibmeta.bibliography_errors.length) {
    console.error(bibmeta.bibliography_errors)
  }
  const contents = createBibliographyElementContents(bibliographyItems)
  console.log('bibliography content ^^')
  console.log(contents.outerHTML)
  return contents
}

export class BibliographyItemView<PropsType extends BaseNodeProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView {
  public initialise = () => {
    console.log('initialize - bibliography item - ^^^^')
    this.createDOM()
    this.updateContents()
  }

  public createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.className = 'csl-entry'
    this.dom.setAttribute('id', this.node.attrs.id)
  }

  public updateContents = async () => {
    const reference = this.node.attrs
    if (reference) {
      const bibliography = await createBibliography([
        reference,
      ] as BibliographyItem[])
      const fragment = sanitize(bibliography.outerHTML)
      this.dom.appendChild(fragment)
    } else {
      const placeholder = document.createElement('div')
      placeholder.className = 'bib-placeholder'
      this.dom.appendChild(placeholder)
    }
  }

  public ignoreMutation = () => true
}

export default createNodeView(BibliographyItemView)
