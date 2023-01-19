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
import { DOMSerializer } from 'prosemirror-model'
import React from 'react'

import { sanitize } from '../lib/dompurify'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export interface CitationViewProps extends BaseNodeProps {
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
  getLibraryItem: (id: string) => BibliographyItem | undefined
  projectID: string
}

export class CitationView<PropsType extends CitationViewProps>
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
    const isDeleted = !!this.node.attrs.dataTracked?.find(
      ({ operation }: { operation: string }) => operation === 'delete'
    )

    if (!isDeleted) {
      this.showPopper()
      this.dom.classList.add('ProseMirror-selectednode')
    }
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
    if (!this.node.type.spec.toDOM) {
      throw Error(`Node view ${this.node.type} doesn't have toDOM method`)
    }
    const outputSpec = this.node.type.spec.toDOM(this.node)
    const { dom, contentDOM } = DOMSerializer.renderSpec(document, outputSpec)
    this.dom = dom as HTMLElement
    this.contentDOM = (contentDOM as HTMLElement) || undefined
    this.updateContents()
    return this
  }

  public updateContents = () => {
    const fragment = sanitize(this.node.attrs.contents, {
      ALLOWED_TAGS: ['i', 'b', 'span', 'sup', 'sub', '#text'],
    })
    this.dom.innerHTML = ''
    this.dom.appendChild(fragment)
    this.setDomAttrs(this.node, this.dom, ['rid', 'contents', 'selectedText'])
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
