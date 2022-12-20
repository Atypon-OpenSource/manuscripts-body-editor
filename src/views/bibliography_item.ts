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

import {
  CitationProvider,
  createBibliographyElementContents,
  loadCitationStyle,
} from '@manuscripts/library'
import {
  buildComment,
  DEFAULT_BUNDLE,
  getModelsByType,
  ManuscriptNodeView,
} from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  CommentAnnotation,
  Model,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'

import { sanitize } from '../lib/dompurify'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

const createBibliography = async (items: BibliographyItem[]) => {
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
  return contents
}

interface BibliographyItemProps extends BaseNodeProps {
  setCommentTarget: (target?: CommentAnnotation) => void
  modelMap: Map<string, Model>
}

export class BibliographyItemView<PropsType extends BibliographyItemProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView {
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
    const bibliographyComments = getModelsByType<CommentAnnotation>(
      this.props.modelMap,
      ObjectTypes.CommentAnnotation
    ).filter((comment) => comment.target === this.node.attrs.id)

    const reference = attrs
    if (reference) {
      const bibliography = await createBibliography([
        reference,
      ] as BibliographyItem[])
      try {
        const fragment = sanitize(bibliography.outerHTML)
        this.dom.appendChild(fragment)

        const doubleButton = document.createElement('div')
        const editButton = document.createElement('div')
        const commentButton = document.createElement('div')

        doubleButton.className = 'bibliography-double-button'
        editButton.className = 'bibliography-edit-button'
        commentButton.className = 'bibliography-comment-button'

        commentButton.addEventListener('click', () => {
          this.props.setCommentTarget(
            buildComment(this.node.attrs.id) as CommentAnnotation
          )
        })

        // TODO:: add event listener for edit button

        editButton.innerHTML = editIcon
        commentButton.innerHTML = commentIcon
        doubleButton.append(editButton, commentButton)
        bibliographyComments.map(() => {})
        this.dom.appendChild(fragment)
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

const editIcon = `
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.706 2.33624L11.553 5.19824L4.345 12.4422L1.498 9.58124L8.706 2.33624V2.33624ZM13.714 1.64624L12.444 0.37024C12.3273 0.253047 12.1886 0.160056 12.0359 0.0966039C11.8831 0.0331518 11.7194 0.000488281 11.554 0.000488281C11.3886 0.000488281 11.2249 0.0331518 11.0721 0.0966039C10.9194 0.160056 10.7807 0.253047 10.664 0.37024L9.447 1.59224L12.295 4.45424L13.715 3.02824C13.8976 2.84462 14.0001 2.59619 14.0001 2.33724C14.0001 2.07829 13.8976 1.82986 13.715 1.64624H13.714ZM0.00800253 13.6032C-0.00418388 13.6571 -0.00246802 13.7131 0.0129883 13.7661C0.0284447 13.819 0.0571327 13.8672 0.096349 13.906C0.135565 13.9448 0.184019 13.973 0.237143 13.9879C0.290268 14.0028 0.346315 14.004 0.400003 13.9912L3.573 13.2172L0.727003 10.3552L0.0070026 13.6032H0.00800253Z"
      fill="#6E6E6E"
    />
  </svg>
`

const commentIcon = `
<svg
    width="20"
    height="15"
    viewBox="0 0 20 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M7.94841 4.18311C7.98238 3.9602 8 3.73191 8 3.49951C8 3.22073 7.97465 2.94787 7.92613 2.68311H13.5C14.8854 2.68311 16.25 3.6425 16.25 5.09977V9.02453L19.1086 12.9949C19.2731 13.2233 19.2958 13.5245 19.1675 13.775C19.0392 14.0255 18.7814 14.1831 18.5 14.1831H5.5C4.11463 14.1831 2.75 13.2237 2.75 11.7664V7.93729C2.9939 7.97821 3.24446 7.99951 3.5 7.99951C3.75553 7.99951 4.00609 7.97821 4.25 7.93729V11.7664C4.25 12.1508 4.67537 12.6831 5.5 12.6831H17.0358L14.8913 9.70467C14.7994 9.57703 14.75 9.42372 14.75 9.26644V5.09977C14.75 4.71538 14.3246 4.18311 13.5 4.18311H7.94841Z"
      fill="#FFBD26"
    />
    <path
      d="M11.5 6.99951H8.5"
      stroke="#FFBD26"
      stroke-width="1.5"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M12 9.99951H7"
      stroke="#FFBD26"
      stroke-width="1.5"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M3.5 1L3.5 6"
      stroke="#FFBD26"
      stroke-width="1.5"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M6 3.5L1 3.5"
      stroke="#FFBD26"
      stroke-width="1.5"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`
