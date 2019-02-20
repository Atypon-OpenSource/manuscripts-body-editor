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
  Build,
  buildEmbeddedCitationItem,
  ManuscriptEditorView,
  ManuscriptNode,
} from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Citation,
  CitationItem,
} from '@manuscripts/manuscripts-json-schema'
import { sanitize } from 'dompurify'
import { TextSelection } from 'prosemirror-state'
import { NodeView } from 'prosemirror-view'
import React from 'react'
import { EditorProps } from '../components/Editor'
import { INSERT, modelsKey, UPDATE } from '../plugins/models'
import { NodeViewCreator } from '../types'

class CitationView implements NodeView {
  public dom: HTMLElement

  private readonly props: EditorProps
  private node: ManuscriptNode
  private readonly view: ManuscriptEditorView
  private readonly getPos: () => number

  constructor(
    props: EditorProps,
    node: ManuscriptNode,
    view: ManuscriptEditorView,
    getPos: () => number
  ) {
    this.props = props
    this.node = node
    this.view = view
    this.getPos = getPos

    this.initialise()
  }

  public update(newNode: ManuscriptNode) {
    if (!newNode.sameMarkup(this.node)) return false
    this.node = newNode
    this.updateContents()
    this.props.popper.update()
    return true
  }

  public stopEvent(event: Event) {
    // https://discuss.prosemirror.net/t/draggable-and-nodeviews/955/13
    return event.type !== 'mousedown' && !event.type.startsWith('drag')
  }

  public ignoreMutation() {
    return true
  }

  public selectNode() {
    const {
      CitationEditor,
      filterLibraryItems,
      getLibraryItem,
      projectID,
      renderReactComponent,
    } = this.props

    const citation = this.getCitation()

    const items = citation.embeddedCitationItems.map(
      (citationItem: CitationItem) =>
        getLibraryItem(citationItem.bibliographyItem)
    )

    const container = document.createElement('div')
    container.className = 'citation-editor'

    renderReactComponent(
      <CitationEditor
        items={items}
        filterLibraryItems={filterLibraryItems}
        selectedText={this.node.attrs.selectedText}
        handleCancel={this.handleCancel}
        handleRemove={this.handleRemove}
        handleCite={this.handleCite}
        projectID={projectID}
        scheduleUpdate={this.props.popper.update}
      />,
      container
    )

    this.props.popper.show(this.dom, container, 'right')
  }

  public deselectNode() {
    this.props.popper.destroy()
  }

  public destroy() {
    this.props.popper.destroy()
  }

  private initialise() {
    this.createDOM()
    this.updateContents()
  }

  private handleCancel = () => {
    const { state } = this.view

    const pos = this.getPos()

    this.view.dispatch(
      state.tr
        .delete(pos, pos + this.node.nodeSize)
        .setSelection(TextSelection.create(state.tr.doc, pos))
    )
  }

  private handleRemove = (id: string) => {
    const citation = this.getCitation()

    citation.embeddedCitationItems = citation.embeddedCitationItems.filter(
      item => item.bibliographyItem !== id
    )

    this.view.dispatch(
      this.view.state.tr.setMeta(modelsKey, {
        [UPDATE]: [citation],
      })
    )
  }

  private handleCite = (items: Array<Build<BibliographyItem>>) => {
    // TODO: reuse if already in library

    const { state } = this.view
    const { getLibraryItem } = this.props

    const citation = this.getCitation()

    for (const item of items) {
      citation.embeddedCitationItems.push(buildEmbeddedCitationItem(item._id))
    }

    const newItems = items.filter(item => !getLibraryItem(item._id))

    for (const item of newItems) {
      // add the database item here so it's ready in time
      this.props.addLibraryItem(item as BibliographyItem)
    }

    const tr = state.tr.setMeta(modelsKey, {
      [INSERT]: newItems,
      [UPDATE]: [citation],
    })

    this.view.dispatch(
      tr.setSelection(TextSelection.near(tr.doc.resolve(state.selection.to)))
    )

    this.props.popper.destroy()
  }

  private getCitation = () => {
    const citation = this.props.getModel<Citation>(this.node.attrs.rid)

    if (!citation) {
      throw new Error('Citation not found')
    }

    return citation
  }

  private createDOM() {
    this.dom = document.createElement('span')
    this.dom.className = 'citation'
    // dom.id = node.attrs.id
    this.dom.setAttribute('data-reference-id', this.node.attrs.rid)
    this.dom.setAttribute('spellcheck', 'false')
    // dom.setAttribute('data-citation-items', node.attrs.citationItems.join('|'))
  }

  private updateContents() {
    this.dom.innerHTML = sanitize(this.node.attrs.contents) // TODO: whitelist
  }
}

const citationView = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new CitationView(props, node, view, getPos)

export default citationView
