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
  Build,
  buildEmbeddedCitationItem,
  ManuscriptNode,
} from '@manuscripts/transform'
import { TextSelection } from 'prosemirror-state'
import React from 'react'

import { bibliographyKey } from '../plugins/bibliography'
import { CitationView, CitationViewProps } from './citation'
import { createEditableNodeView } from './creators'
import { EditableBlockProps } from './editable_block'

export interface CitationEditableProps extends CitationViewProps {
  filterLibraryItems: (query: string) => Promise<BibliographyItem[]>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  deleteModel: (id: string) => Promise<string>
  modelMap: Map<string, Model>
  matchLibraryItemByIdentifier: (
    item: BibliographyItem
  ) => BibliographyItem | undefined
  setLibraryItem: (item: BibliographyItem) => void
  removeLibraryItem: (id: string) => void
}

export class CitationEditableView extends CitationView<
  CitationEditableProps & EditableBlockProps
> {
  public showPopper = () => {
    const {
      components: { CitationEditor, CitationViewer },
      filterLibraryItems,
      setLibraryItem,
      removeLibraryItem,
      getLibraryItem,
      getCapabilities,
      projectID,
      renderReactComponent,
      saveModel,
      deleteModel,
      modelMap,
    } = this.props

    const capabilities = getCapabilities()

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

    const findPosition = (doc: ManuscriptNode, id: string) => {
      let nodePos: number | undefined = undefined

      doc.descendants((node, pos) => {
        if (node.attrs.id === id) {
          nodePos = pos
        }
      })

      return nodePos
    }

    const handleSave = async (data: Partial<BibliographyItem>) => {
      const ref = await saveModel({
        ...data,
      } as BibliographyItem)

      const pos = findPosition(this.view.state.doc, ref._id)
      if (pos) {
        this.view.dispatch(
          this.view.state.tr.setNodeMarkup(pos, undefined, {
            id: ref._id,
            containerTitle: ref['container-title'],
            doi: ref.DOI,
            ...ref,
          })
        )
      }
    }

    if (!this.popperContainer) {
      this.popperContainer = document.createElement('div')
      this.popperContainer.className = 'citation-editor'
    }

    const component = capabilities?.editArticle ? (
      <CitationEditor
        items={items}
        saveModel={handleSave}
        deleteModel={deleteModel}
        modelMap={modelMap}
        setLibraryItem={setLibraryItem}
        filterLibraryItems={filterLibraryItems}
        removeLibraryItem={removeLibraryItem}
        importItems={this.importItems}
        selectedText={this.node.attrs.selectedText}
        setComment={this.props.setComment}
        handleCancel={this.handleCancel}
        handleClose={this.handleClose}
        handleRemove={this.handleRemove}
        updatePopper={this.updatePopper}
        handleCite={this.handleCite}
        canEdit={capabilities.editCitationsAndRefs}
        citation={citation}
        updateCitation={updateCitation}
        projectID={projectID}
        scheduleUpdate={this.props.popper.update}
      />
    ) : (
      <CitationViewer
        items={items}
        setComment={this.props.setComment}
        scheduleUpdate={this.props.popper.update}
      />
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
    const embeddedCitationItems = citation.embeddedCitationItems.filter(
      (item) => item.bibliographyItem !== id
    )

    citation.embeddedCitationItems = embeddedCitationItems
    await saveModel(citation)

    const pos = this.getPos()
    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
      })
    )

    if (embeddedCitationItems.length > 0) {
      window.setTimeout(() => {
        this.showPopper() // redraw the popper
      }, 100)
    } else {
      const { tr } = this.view.state
      const pos = this.getPos()

      tr.delete(pos, pos + 1)
      this.view.dispatch(tr)
    }

    this.props.popper.destroy()
  }

  private updatePopper = () => {
    this.props.popper.destroy()

    window.setTimeout(() => {
      this.showPopper()
    }, 100)
  }

  private handleCite = async (items: Array<Build<BibliographyItem>>) => {
    const { matchLibraryItemByIdentifier, saveModel, setLibraryItem } =
      this.props

    const citation = this.getCitation()
    let triggerUpdate = false

    for (const item of items) {
      const existingItem = matchLibraryItemByIdentifier(
        item as BibliographyItem
      )

      if (existingItem) {
        item._id = existingItem._id
      } else {
        triggerUpdate = true
        // add the item to the model map so it's definitely available
        setLibraryItem(item as BibliographyItem)

        // save the new item
        await saveModel(item)
      }

      citation.embeddedCitationItems.push(buildEmbeddedCitationItem(item._id))
    }

    await saveModel(citation)

    const pos = this.getPos()
    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
      })
    )

    if (triggerUpdate) {
      this.view.dispatch(
        this.view.state.tr.setMeta(bibliographyKey, {
          bibliographyInserted: true,
        })
      )
    }

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
