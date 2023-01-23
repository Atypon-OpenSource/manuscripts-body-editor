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

import { BibliographyItem, Model } from '@manuscripts/json-schema'
import {
  CitationProvider,
  createBibliographyElementContents,
  loadCitationStyle,
} from '@manuscripts/library'
import {
  Build,
  DEFAULT_BUNDLE,
  ManuscriptNodeView,
} from '@manuscripts/transform'

import { sanitize } from '../lib/dompurify'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import React from 'react'

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

interface BibliographyItemViewProps extends BaseNodeProps {
  filterLibraryItems: (query: string) => Promise<BibliographyItem[]>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  deleteModel: (id: string) => Promise<string>
  setLibraryItem: (item: BibliographyItem) => void
  removeLibraryItem: (id: string) => void
  modelMap: Map<string, Model>
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
}

export class BibliographyItemView<PropsType extends BibliographyItemViewProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  protected popperContainer?: HTMLDivElement

  public showPopper = (referenceID: string) => {
    const {
      filterLibraryItems,
      saveModel,
      deleteModel,
      setLibraryItem,
      removeLibraryItem,
      renderReactComponent,
      modelMap,
      components: { ReferencesEditor },
    } = this.props

    if (!this.popperContainer) {
      this.popperContainer = document.createElement('div')
      this.popperContainer.className = 'references'
    }

    renderReactComponent(
      <ReferencesEditor
        filterLibraryItems={filterLibraryItems}
        saveModel={saveModel}
        deleteModel={deleteModel}
        setLibraryItem={setLibraryItem}
        removeLibraryItem={removeLibraryItem}
        modelMap={modelMap}
        referenceID={referenceID}
      />,
      this.popperContainer
    )

    this.props.popper.show(this.dom, this.popperContainer, 'right')
  }

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

        const doubleButton = document.createElement('div')
        const editButton = document.createElement('div')
        const commentButton = document.createElement('div')

        doubleButton.className = 'bibliography-double-button'
        editButton.className = 'bibliography-edit-button'
        commentButton.className = 'bibliography-comment-button'

        editButton.addEventListener('click', () => {
          this.showPopper(this.node.attrs.id)
        })

        editButton.innerHTML = `
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
        commentButton.innerHTML = ''
        doubleButton.append(editButton, commentButton)
        this.dom.appendChild(doubleButton)
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
