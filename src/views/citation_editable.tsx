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
  Citation,
  CitationItem,
  Model,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'
import { TextSelection } from 'prosemirror-state'
import React from 'react'

import { CitationView, CitationViewProps } from './citation'
import { createEditableNodeView } from './creators'
import { EditableBlockProps } from './editable_block'

export interface CitationEditableProps extends CitationViewProps {
  filterLibraryItems: (query: string) => Promise<BibliographyItem[]>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  matchLibraryItemByIdentifier: (
    item: BibliographyItem
  ) => BibliographyItem | undefined
  setLibraryItem: (item: BibliographyItem) => void
}

export class CitationEditableView extends CitationView<
  CitationEditableProps & EditableBlockProps
> {
  public showPopper = () => {
    const {
      components: { CitationEditor, CitationViewer },
      filterLibraryItems,
      getLibraryItem,
      permissions,
      projectID,
      renderReactComponent,
      saveModel,
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

    const updateCitation = async (data: Partial<Citation>) => {
      await saveModel({
        ...citation,
        ...data,
      })

      this.view.dispatch(this.view.state.tr.setMeta('update', true))

      this.props.popper.update()
    }

    if (!this.popperContainer) {
      this.popperContainer = document.createElement('div')
      this.popperContainer.className = 'citation-editor'
    }

    const component = permissions.write ? (
      <CitationEditor
        items={items}
        filterLibraryItems={filterLibraryItems}
        importItems={this.importItems}
        selectedText={this.node.attrs.selectedText}
        handleCancel={this.handleCancel}
        handleClose={this.handleClose}
        handleRemove={this.handleRemove}
        handleCite={this.handleCite}
        citation={citation}
        updateCitation={updateCitation}
        projectID={projectID}
        scheduleUpdate={this.props.popper.update}
      />
    ) : (
      <CitationViewer items={items} scheduleUpdate={this.props.popper.update} />
    )

    renderReactComponent(component, this.popperContainer)

    this.props.popper.show(this.dom, this.popperContainer, 'right')
  }

  private handleClose = () => {
    // move the cursor after this node
    const selection = TextSelection.create(
      this.view.state.tr.doc,
      this.getPos() + 1
    )
    this.view.dispatch(this.view.state.tr.setSelection(selection))

    this.props.popper.destroy()
  }

  private handleCancel = () => {
    const { state } = this.view

    const pos = this.getPos()
    const tr = state.tr.delete(pos, pos + this.node.nodeSize)
    const selection = TextSelection.create(tr.doc, pos)

    this.view.dispatch(tr.setSelection(selection))
  }

  private handleRemove = async (id: string) => {
    const { saveModel } = this.props

    const citation = this.getCitation()

    citation.embeddedCitationItems = citation.embeddedCitationItems.filter(
      (item) => item.bibliographyItem !== id
    )

    await saveModel(citation)

    this.props.popper.destroy()

    window.setTimeout(() => {
      this.showPopper() // redraw the popper
    }, 100)
  }

  private handleCite = async (items: Array<Build<BibliographyItem>>) => {
    const { matchLibraryItemByIdentifier, saveModel, setLibraryItem } =
      this.props

    const citation = this.getCitation()

    for (const item of items) {
      const existingItem = matchLibraryItemByIdentifier(
        item as BibliographyItem
      )

      if (existingItem) {
        item._id = existingItem._id
      } else {
        // add the item to the model map so it's definitely available
        setLibraryItem(item as BibliographyItem)

        // save the new item
        await saveModel(item)
      }

      citation.embeddedCitationItems.push(buildEmbeddedCitationItem(item._id))
    }

    await saveModel(citation)

    this.handleClose()
  }

  private importItems = async (items: Array<Build<BibliographyItem>>) => {
    const { matchLibraryItemByIdentifier, saveModel, setLibraryItem } =
      this.props

    const newItems: BibliographyItem[] = []

    for (const item of items) {
      const existingItem = matchLibraryItemByIdentifier(
        item as BibliographyItem
      )

      if (!existingItem) {
        // add the item to the model map so it's definitely available
        setLibraryItem(item as BibliographyItem)

        // save the new item
        const newItem = await saveModel(item as BibliographyItem)

        newItems.push(newItem)
      }
    }

    return newItems
  }
}

export default createEditableNodeView(CitationEditableView)
