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
  ObjectTypes,
} from '@manuscripts/json-schema'
import { findMatchingBibliographyItem } from '@manuscripts/library'
import { Build, ManuscriptNode, schema } from '@manuscripts/transform'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import { TextSelection, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React from 'react'

import { getBibliographyPluginState } from '../plugins/bibliography'
import { CitationView, CitationViewProps } from './citation'
import { createEditableNodeView } from './creators'
import { EditableBlockProps } from './editable_block'

const createBibliographySection = (bibItem?: ProsemirrorNode) =>
  schema.nodes.bibliography_section.createAndFill({}, [
    schema.nodes.section_title.create({}, schema.text('Bibliography')),
    schema.nodes.bibliography_element.create({}, bibItem ? [bibItem] : []),
  ]) as ManuscriptNode

export class CitationEditableView extends CitationView<
  CitationViewProps & EditableBlockProps
> {
  public showPopper = () => {
    const {
      components: { CitationEditor, CitationViewer },
      getCapabilities,
      projectID,
      renderReactComponent,
    } = this.props

    const capabilities = getCapabilities()

    const citation = this.getCitation()
    const items = this.getBibliographyItems()

    const updateCitation = async (data: Partial<Citation>) => {
      this.updateNode({ ...citation, ...data })

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
      if (data._id && !findPosition(this.view.state.doc, data._id)) {
        this.insertBibliographyNode(this.view, data as Build<BibliographyItem>)
      } else {
        const {
          _id: id,
          'container-title': containerTitle,
          DOI: doi,
          ...rest
        } = data as BibliographyItem

        this.updateNodeAttrs({
          id,
          containerTitle,
          doi,
          ...rest,
        })
      }
    }

    if (!this.popperContainer) {
      this.popperContainer = document.createElement('div')
      this.popperContainer.className = 'citation-editor'
    }

    const bib = getBibliographyPluginState(this.view.state)

    const component = capabilities?.editArticle ? (
      <CitationEditor
        items={items}
        saveNode={handleSave}
        deleteNode={this.deleteNode}
        insertBibliographyNode={(item: Build<BibliographyItem>) =>
          this.insertBibliographyNode(this.view, item)
        }
        bibliographyItems={bib.bibliographyItems}
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
    const citation = this.getCitation()
    const items = citation.embeddedCitationItems.filter(
      (i) => i.bibliographyItem !== id
    )

    if (items.length > 0) {
      citation.embeddedCitationItems = items

      this.updateNode(citation)

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

  private handleCite = async (items: Build<BibliographyItem>[]) => {
    const bib = getBibliographyPluginState(this.view.state)

    const citation = this.getCitation()

    for (const item of items) {
      const existingItem = findMatchingBibliographyItem(
        item as BibliographyItem,
        bib.bibliographyItems
      )

      if (existingItem) {
        item._id = existingItem._id
      } else {
        this.insertBibliographyNode(this.view, item)
      }

      citation.embeddedCitationItems.push({
        _id: '_',
        objectType: ObjectTypes.CitationItem,
        bibliographyItem: item._id,
      })
    }

    this.updateNode(citation)

    this.handleClose()
  }

  private insertBibliographyNode(
    view: EditorView,
    item: Build<BibliographyItem>
  ) {
    const { doc, tr } = view.state
    const { DOI: doi, ['container-title']: containerTitle, ...restAttr } = item

    let bibElement: ProsemirrorNode | null = null
    let pos: number | null = null
    doc.descendants((node, nodePos) => {
      if (node.type === schema.nodes.bibliography_element) {
        bibElement = node
        pos = nodePos
      }
    })

    let newTr: Transaction

    const bibItem = schema.nodes.bibliography_item.create({
      id: item._id,
      doi,
      containerTitle,
      ...restAttr,
    })

    if (bibElement && pos) {
      newTr = tr.insert(pos + 1, bibItem)
    } else {
      newTr = tr.insert(tr.doc.content.size, createBibliographySection(bibItem))
    }

    view.dispatch(newTr)
    return false
  }

  private importItems = async (items: Array<Build<BibliographyItem>>) => {
    const bib = getBibliographyPluginState(this.view.state)

    const newItems: BibliographyItem[] = []

    for (const item of items) {
      const existingItem = findMatchingBibliographyItem(
        item as BibliographyItem,
        bib.bibliographyItems
      )

      if (!existingItem) {
        this.insertBibliographyNode(this.view, item)

        newItems.push(item as BibliographyItem)
      }
    }

    return newItems
  }

  private updateNode = (citation: Citation) => {
    const rids = citation.embeddedCitationItems.map((i) => i.bibliographyItem)
    const { tr } = this.view.state
    this.view.dispatch(
      tr.setNodeMarkup(this.getPos(), undefined, {
        id: citation._id,
        rids,
      })
    )
  }
}

export default createEditableNodeView(CitationEditableView)
