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

import { BibliographyItem } from '@manuscripts/json-schema'
import { CitationProvider } from '@manuscripts/library'

import { CSLProps } from '../configs/ManuscriptsEditor'
import { sanitize } from '../lib/dompurify'
import { bibliographyKey } from '../plugins/bibliography'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'

const createBibliography = async (
  bibliographyItems: BibliographyItem[],
  cslProps: CSLProps
) => {
  const bibliographyItemsMap = new Map(
    bibliographyItems.map((item: BibliographyItem) => [item._id, item])
  )
  const getLibraryItem = (id: string) => bibliographyItemsMap.get(id)

  const provider = new CitationProvider({
    getLibraryItem,
    citationStyle: cslProps.style || '',
    locale: cslProps.locale,
  })

  const bibliography = provider.makeBibliography(bibliographyItems)

  const [bibmeta, generatedBibliographyItems] = bibliography

  if (bibmeta.bibliography_errors.length) {
    console.error(bibmeta.bibliography_errors) // tslint:disable-line:no-console
  }

  let fragment = '<div class="contents">'
  const index = generatedBibliographyItems[0].indexOf('class="csl-entry"')
  for (let i = 0; i < generatedBibliographyItems.length; i++) {
    generatedBibliographyItems[i] =
      generatedBibliographyItems[i].slice(0, index) +
      `id="${bibmeta.entry_ids[i]}"` +
      generatedBibliographyItems[i].slice(index)
    fragment = fragment + generatedBibliographyItems[i]
  }

  return sanitize(fragment + '</div>')
}

export class BibliographyElementBlockView<
  PropsType extends BaseNodeProps
> extends BlockView<PropsType> {
  private container: HTMLElement
  public stopEvent = () => true

  public ignoreMutation = () => true

  public updateContents = async () => {
    console.log('Update contents')
    const bibliographyItems: BibliographyItem[] = bibliographyKey.getState(
      this.view.state
    ).bibliographyItems

    const bibliographyFragment = await createBibliography(
      bibliographyItems,
      this.props.cslProps
    )

    const oldContent = this.container.querySelector('.contents')

    if (oldContent) {
      this.container.replaceChild(bibliographyFragment, oldContent)
    } else {
      this.container.appendChild(bibliographyFragment)
    }
  }
  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block')
    this.container.contentEditable = 'false'

    this.dom.appendChild(this.container)

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('block')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.contentDOM.hidden = true

    this.container.appendChild(this.contentDOM)
  }
}

export default createNodeView(BibliographyElementBlockView)
