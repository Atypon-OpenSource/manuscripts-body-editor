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
} from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  CitationItem,
} from '@manuscripts/manuscripts-json-schema'
import { TextSelection } from 'prosemirror-state'
import React from 'react'
import { EditorProps } from '../components/Editor'
import { INSERT, modelsKey, UPDATE } from '../plugins/models'
import { CitationView } from './citation'
import { createEditableNodeView } from './creators'

export class CitationEditableView extends CitationView<EditorProps> {
  public showPopper = () => {
    const {
      components: { CitationEditor, CitationViewer },
      filterLibraryItems,
      getLibraryItem,
      permissions,
      projectID,
      renderReactComponent,
    } = this.props

    const citation = this.getCitation()

    const items = citation.embeddedCitationItems.map(
      (citationItem: CitationItem) =>
        getLibraryItem(citationItem.bibliographyItem)
    )

    if (!this.popperContainer) {
      this.popperContainer = document.createElement('div')
      this.popperContainer.className = 'citation-editor'
    }

    const component = permissions.write ? (
      <CitationEditor
        items={items}
        filterLibraryItems={filterLibraryItems}
        selectedText={this.node.attrs.selectedText}
        handleCancel={this.handleCancel}
        handleRemove={this.handleRemove}
        handleCite={this.handleCite}
        projectID={projectID}
        scheduleUpdate={this.props.popper.update}
      />
    ) : (
      <CitationViewer items={items} scheduleUpdate={this.props.popper.update} />
    )

    renderReactComponent(component, this.popperContainer)

    this.props.popper.show(this.dom, this.popperContainer, 'right')
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

    if (!this.props.addLibraryItem) {
      throw new Error('addLibraryItem not defined')
    }

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

    this.view.focus()

    this.view.dispatch(
      tr.setSelection(TextSelection.near(tr.doc.resolve(state.selection.to)))
    )

    this.props.popper.destroy()
  }
}

export default createEditableNodeView(CitationEditableView)
