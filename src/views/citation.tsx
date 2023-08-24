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
  BibliographyItem,
  Citation,
  CitationItem,
  Model,
  ObjectTypes,
} from '@manuscripts/json-schema'
import {
  // buildCitationNodes,
  // buildCitations,
  CitationProvider,
} from '@manuscripts/library'
import { ManuscriptNodeView } from '@manuscripts/transform'
import { DOMSerializer } from 'prosemirror-model'
import React from 'react'

import { sanitize } from '../lib/dompurify'
import { getBibliographyItemFn } from '../plugins/bibliography/bibliography-utils'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export interface CitationViewProps extends BaseNodeProps {
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
  getCitationProvider: () => CitationProvider | undefined
  getLibraryItem: (id: string) => BibliographyItem | undefined
  projectID: string
  modelMap: Map<string, Model>
}

export class CitationView<PropsType extends CitationViewProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  protected popperContainer?: HTMLDivElement

  // private getBibliographyItem = () => getBibliographyItemFn(this.props)
  getBibliographyItem = getBibliographyItemFn(this.props)

  // private getBibliographyItems = () => {
  //   const bibliographyItems: BibliographyItem[] = []
  //   this.props.modelMap?.forEach((value) => {
  //     if (value.objectType === 'MPBibliographyItem') {
  //       bibliographyItems.push(value as BibliographyItem)
  //     }
  //   })

  //   return bibliographyItems
  // }

  // private createCitation = (citationId: string) => {
  //   const { style, locale } = this.props.cslProps
  //   const citationNodes = buildCitationNodes(
  //     this.view.state.doc,
  //     this.props.getModel
  //   )
  //   const citations = buildCitations(citationNodes, (id: string) =>
  //     this.getBibliographyItem(id)
  //   )
  //   const generatedCitations = CitationProvider.rebuildProcessorState(
  //     citations,
  //     this.getBibliographyItems(),
  //     style || '',
  //     locale,
  //     'html'
  //   ).map((item) => item[2]) // id, noteIndex, output

  //   let contents = ''
  //   citationNodes.forEach(([node, pos], index) => {
  //     if (node.attrs.rid === citationId) {
  //       contents = generatedCitations[index]
  //     }
  //   })

  //   if (contents === '[NO_PRINTED_FORM]') {
  //     contents = ''
  //   }

  //   return contents
  // }

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
    // const citationText = this.createCitation(this.node.attrs.rid)
    // console.log('generated', citationText, this.node)
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
