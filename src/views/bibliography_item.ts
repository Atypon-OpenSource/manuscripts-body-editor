/*!
 * © 2022 Atypon Systems LLC
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

import { BibliographyItem, CommentAnnotation } from '@manuscripts/json-schema'
import {
  CitationProvider,
  createBibliographyElementContents,
  loadCitationStyle,
} from '@manuscripts/library'
import {
  DEFAULT_BUNDLE,
  ManuscriptNodeView,
} from '@manuscripts/transform'

import { sanitize } from '../lib/dompurify'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

const createBibliography = async (items: BibliographyItem[]) => {
  const styleOpts = { bundleID: DEFAULT_BUNDLE }
  const citationStyle = await loadCitationStyle(styleOpts)
  const [bibmeta, bibliographyItems] =
    CitationProvider.makeBibliographyFromCitations(items, citationStyle)

  if (bibmeta.bibliography_errors.length) {
    console.error(bibmeta.bibliography_errors)
  }
  const contents = createBibliographyElementContents(bibliographyItems)
  return contents
}

interface BibliographyItemProps extends BaseNodeProps {
  setComment: (comment?: CommentAnnotation) => void
}

export class BibliographyItemView<PropsType extends BibliographyItemProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.className = 'bib-item'
    this.dom.setAttribute('id', this.node.attrs.id)
  }

  public updateContents = async () => {
    const attrs = { ...this.node.attrs }

    delete attrs.paragraphStyle
    delete attrs.dataTracked

    attrs['_id'] = this.node.attrs.id
    delete attrs.id

    if (attrs.doi) {
      attrs['DOI'] = attrs.doi
      delete attrs.doi
    }

    const reference = attrs
    if (reference) {
      const bibliography = await createBibliography([
        reference,
      ] as BibliographyItem[])
      try {
        const fragment = sanitize(bibliography.outerHTML)
        this.dom.appendChild(fragment)
        //
        // const doubleButton = document.createElement('div')
        // const editButton = document.createElement('div')
        // const commentButton = document.createElement('div')
        //
        // doubleButton.className = 'bibliography-double-button'
        // editButton.className = 'bibliography-edit-button'
        // commentButton.className = 'bibliography-comment-button'
        //
        // commentButton.addEventListener('click', () => {
        //   this.props.setComment(
        //     buildComment(this.node.attrs.id) as CommentAnnotation
        //   )
        // })
        //
        // // TODO:: add event listener for edit button
        //
        // editButton.innerHTML = editIcon
        // commentButton.innerHTML = commentIcon
        // doubleButton.append(editButton, commentButton)
        // this.dom.appendChild(doubleButton)
      } catch (e) {
        console.error(e) // tslint:disable-line:no-console
        // TODO: improve the UI for presenting offline/import errors
        window.alert(
          'There was an error loading the HTML purifier, please reload to try again'
        )
      }
    }
  }

  public ignoreMutation = () => true
}

export default createNodeView(BibliographyItemView)
