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

import { BibliographyItem, ObjectTypes } from '@manuscripts/json-schema'
import { CitationNode, ManuscriptNodeView } from '@manuscripts/transform'
import { DOMSerializer } from 'prosemirror-model'
import React, { createElement } from 'react'
import ReactDOM from 'react-dom'

import { TrackChangesReview } from '../components/track-changes/TrackChangesReview'
import { sanitize } from '../lib/dompurify'
import {
  getChangeClasses,
  isDeleted,
  isPendingSetAttrs,
} from '../lib/track-changes-utils'
import { getBibliographyPluginState } from '../plugins/bibliography'
import { getCitation } from '../plugins/bibliography/bibliography-utils'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export interface CitationViewProps extends BaseNodeProps {
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
  projectID: string
}

export class CitationView<PropsType extends CitationViewProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  protected popperContainer?: HTMLDivElement

  public showPopper = () => {
    const {
      components: { CitationViewer },
      projectID,
      renderReactComponent,
    } = this.props

    const items = this.getBibliographyItems()

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
      ({ operation, status }: { operation: string; status: string }) =>
        operation === 'delete' && status !== 'rejected'
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
    const bib = getBibliographyPluginState(this.view.state)

    const citation = this.getCitation()
    const classes = ['citation', ...getChangeClasses(this.node)]
    const element = document.createElement('span')
    element.className = classes.join(' ')
    const text = bib.renderedCitations.get(citation._id)
    const fragment = sanitize(
      text && text !== '[NO_PRINTED_FORM]' ? text : ' ',
      {
        ALLOWED_TAGS: ['i', 'b', 'span', 'sup', 'sub', '#text'],
      }
    )
    element.appendChild(fragment)
    this.dom.className = 'citation-wrapper'
    this.dom.innerHTML = ''
    this.dom.appendChild(element)

    if (
      isPendingSetAttrs(this.node) &&
      !isDeleted(this.node) &&
      citation.embeddedCitationItems.length
    ) {
      this.dom.appendChild(this.renderTrackChangesReview())
    }
    this.setDomAttrs(this.node, this.dom, ['rids', 'contents', 'selectedText'])
  }

  public renderTrackChangesReview = () => {
    const { popper } = this.props
    const el = document.createElement('span')
    el.classList.add('track-changes-review')
    ReactDOM.render(
      createElement(TrackChangesReview, {
        node: this.node,
        popper,
        target: el,
      }),
      el
    )
    return el
  }

  public getCitation = () => {
    const citation = getCitation(this.node as CitationNode)
    if (!citation) {
      throw new Error('Citation not found')
    }

    return citation
  }

  public getBibliographyItems = (): BibliographyItem[] => {
    const bib = getBibliographyPluginState(this.view.state)

    const citation = this.node as CitationNode
    return citation.attrs.rids.map((rid) => {
      const item = bib.bibliographyItems.get(rid)

      if (!item) {
        const placeholder = {
          _id: rid,
          objectType: ObjectTypes.BibliographyItem,
          title: '[missing library item]',
        }

        return placeholder as BibliographyItem
      }

      return item
    })
  }
}

export default createNodeView(CitationView)
