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

import { BibliographyItem, CommentAnnotation } from '@manuscripts/json-schema'
import { CitationProvider } from '@manuscripts/library'
import { buildComment } from '@manuscripts/transform'
import React from 'react'

import { commentIcon, editIcon } from '../assets'
import { CSLProps } from '../configs/ManuscriptsEditor'
import { sanitize } from '../lib/dompurify'
import { bibliographyKey } from '../plugins/bibliography'
import { getReferencesModelMap } from '../plugins/bibliography/bibliography-utils'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'

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
  for (let i = 0; i < generatedBibliographyItems.length; i++) {
    generatedBibliographyItems[i] =
      `<div id=${bibmeta.entry_ids[i]} class="bib-item">` +
      '<div class="csl-bib-body">' +
      generatedBibliographyItems[i] +
      '</div></div>'
    fragment = fragment + generatedBibliographyItems[i]
  }

  return sanitize(fragment + '</div>')
}

interface BibliographyElementViewProps extends BaseNodeProps {
  setComment: (comment?: CommentAnnotation) => void
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
}
export class BibliographyElementBlockView<
  PropsType extends BibliographyElementViewProps & EditableBlockProps
> extends BlockView<PropsType> {
  public container: HTMLElement
  public popperContainer?: HTMLDivElement

  public showPopper = (referenceID: string) => {
    const {
      renderReactComponent,
      components: { ReferencesEditor },
    } = this.props

    const handleSave = async (data: Partial<BibliographyItem>) => {
      const {
        _id: id,
        'container-title': containerTitle,
        DOI: doi,
        ...rest
      } = data as BibliographyItem

      this.updateNodeAttrs({
        id,
        containerTitle,
        doi,
        ...rest,
      })
    }

    if (!this.popperContainer) {
      this.popperContainer = document.createElement('div')
      this.popperContainer.className = 'references'
    }

    renderReactComponent(
      <ReferencesEditor
        saveModel={handleSave}
        deleteModel={this.deleteNode}
        modelMap={getReferencesModelMap(this.view.state.doc, true)}
        referenceID={referenceID}
      />,
      this.popperContainer
    )

    this.props.popper.show(this.dom, this.popperContainer, 'right')
  }

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

    const bibItems = bibliographyFragment.querySelectorAll('.bib-item')
    bibItems.forEach((element) => {
      const doubleButton = document.createElement('div')
      const editButton = document.createElement('button')
      const commentButton = document.createElement('button')

      doubleButton.className = 'bibliography-double-button'
      editButton.className = 'bibliography-edit-button'
      commentButton.className = 'bibliography-comment-button'

      commentButton.addEventListener('click', (e) => {
        e.preventDefault()
        this.props.setComment(buildComment(element.id) as CommentAnnotation)
      })

      editButton.addEventListener('click', (e) => {
        e.preventDefault()
        this.showPopper(element.id)
        this.popperContainer = undefined
      })

      editButton.innerHTML = editIcon
      commentButton.innerHTML = commentIcon
      doubleButton.append(editButton, commentButton)

      if (
        this.props.getCapabilities().seeReferencesButtons &&
        !element.querySelector('.bibliography-double-button')
      ) {
        element.appendChild(doubleButton)
      }
      editButton.disabled = !this.props.getCapabilities().editCitationsAndRefs
    })

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
