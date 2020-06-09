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

import { ManuscriptNodeView } from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Citation,
  CitationItem,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'
import { sanitize } from 'dompurify'
import React from 'react'

import { ViewerProps } from '../components/Viewer'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class CitationView<PropsType extends ViewerProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView {
  protected popperContainer?: HTMLDivElement

  public showPopper = () => {
    const {
      components: { CitationViewer },
      getLibraryItem,
      projectID,
      renderReactComponent,
    } = this.props

    const citation = this.getCitation()

    const items = citation.embeddedCitationItems.map(
      (citationItem: CitationItem): BibliographyItem => {
        const libraryItem = getLibraryItem(citationItem.bibliographyItem)

        if (!libraryItem) {
          const placeholderItem = {
            _id: citationItem.bibliographyItem,
            objectType: ObjectTypes.BibliographyItem,
            title: '[missing library item]',
          }

          return placeholderItem as BibliographyItem
        }

        return libraryItem
      }
    )

    if (!this.popperContainer) {
      this.popperContainer = document.createElement('div')
      this.popperContainer.className = 'citation-editor'
    }

    renderReactComponent(
      <CitationViewer
        items={items}
        projectID={projectID}
        scheduleUpdate={this.props.popper.update}
      />,
      this.popperContainer
    )

    this.props.popper.show(this.dom, this.popperContainer, 'right')
  }

  public ignoreMutation = () => true

  public selectNode = () => {
    this.showPopper()
    this.dom.classList.add('ProseMirror-selectednode')
  }

  public deselectNode = () => {
    this.dom.classList.remove('ProseMirror-selectednode')
    this.props.popper.destroy()

    if (this.popperContainer) {
      this.props.unmountReactComponent(this.popperContainer)
    }
  }

  public destroy = () => {
    this.props.popper.destroy()

    if (this.popperContainer) {
      this.props.unmountReactComponent(this.popperContainer)
    }
  }

  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public createDOM = () => {
    this.dom = document.createElement('span')
    this.dom.className = 'citation'
    this.dom.setAttribute('data-reference-id', this.node.attrs.rid)
    this.dom.setAttribute('spellcheck', 'false')
  }

  public updateContents = () => {
    this.dom.innerHTML = sanitize(this.node.attrs.contents) // TODO: whitelist
  }

  public getCitation = () => {
    const citation = this.props.getModel<Citation>(this.node.attrs.rid)

    if (!citation) {
      throw new Error('Citation not found')
    }

    return citation
  }
}

export default createNodeView(CitationView)
