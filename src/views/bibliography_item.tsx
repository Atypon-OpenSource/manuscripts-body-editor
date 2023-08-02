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
  BibliographyItem,
  CommentAnnotation,
  Model,
} from '@manuscripts/json-schema'
import {
  CitationProvider,
  createBibliographyElementContents,
} from '@manuscripts/library'
import { Build, buildComment, ManuscriptNodeView } from '@manuscripts/transform'
import React from 'react'

import { commentIcon, editIcon } from '../assets'
import { CSLProps } from '../configs/ManuscriptsEditor'
import { sanitize } from '../lib/dompurify'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'

const createBibliography = async (
  items: BibliographyItem[],
  cslProps: CSLProps
) => {
  const { style, locale, lang } = cslProps

  if (!style) {
    throw new Error(`CSL Style not found`)
  }

  const [bibmeta, bibliographyItems] =
    CitationProvider.makeBibliographyFromCitations(items, style, locale, lang)

  if (bibmeta.bibliography_errors.length) {
    console.error(bibmeta.bibliography_errors)
  }
  return createBibliographyElementContents(bibliographyItems)
}

interface BibliographyItemViewProps extends BaseNodeProps {
  setComment: (comment?: CommentAnnotation) => void
  filterLibraryItems: (query: string) => Promise<BibliographyItem[]>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  deleteModel: (id: string) => Promise<string>
  setLibraryItem: (item: BibliographyItem) => void
  removeLibraryItem: (id: string) => void
  modelMap: Map<string, Model>
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
}

export class BibliographyItemView<
    PropsType extends BibliographyItemViewProps & EditableBlockProps
  >
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

    const handleSave = async (data: Partial<BibliographyItem>) => {
      const ref = await saveModel({
        ...data,
      } as BibliographyItem)

      this.view.dispatch(
        this.view.state.tr.setNodeMarkup(this.getPos(), undefined, {
          id: ref._id,
          containerTitle: ref['container-title'],
          doi: ref.DOI,
          ...ref,
        })
      )
    }

    if (!this.popperContainer) {
      this.popperContainer = document.createElement('div')
      this.popperContainer.className = 'references'
    }

    renderReactComponent(
      <ReferencesEditor
        filterLibraryItems={filterLibraryItems}
        saveModel={handleSave}
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
    const reference = this.props.getModel<BibliographyItem>(this.node.attrs.id)
    if (reference) {
      const bibliography = await createBibliography(
        [reference],
        this.props.cslProps
      )
      try {
        const fragment = sanitize(bibliography.outerHTML)
        this.dom.innerHTML = ''
        this.dom.appendChild(fragment)

        const doubleButton = document.createElement('div')
        const editButton = document.createElement('button')
        const commentButton = document.createElement('button')

        doubleButton.className = 'bibliography-double-button'
        editButton.className = 'bibliography-edit-button'
        commentButton.className = 'bibliography-comment-button'

        commentButton.addEventListener('click', (e) => {
          e.preventDefault()
          this.props.setComment(
            buildComment(this.node.attrs.id) as CommentAnnotation
          )
        })

        editButton.addEventListener('click', (e) => {
          e.preventDefault()
          this.showPopper(this.node.attrs.id)
          this.popperContainer = undefined
        })

        editButton.innerHTML = editIcon
        commentButton.innerHTML = commentIcon
        doubleButton.append(editButton, commentButton)
        if (this.props.getCapabilities().seeReferencesButtons) {
          this.dom.appendChild(doubleButton)
        }
        editButton.disabled = !this.props.getCapabilities().editCitationsAndRefs
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
