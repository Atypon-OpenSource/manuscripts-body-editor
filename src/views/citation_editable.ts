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
  CommentAnnotation,
  ObjectTypes,
} from '@manuscripts/json-schema'
import { findMatchingBibliographyItem } from '@manuscripts/library'
import {
  CitationEditorProps,
  CitationViewer,
  CitationViewerProps,
} from '@manuscripts/style-guide'
import {
  BibliographyItemNode,
  buildComment,
  Decoder,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { TextSelection } from 'prosemirror-state'
import { findChildren, findChildrenByType } from 'prosemirror-utils'

import { crossref } from '../citation-sources'
import { getBibliographyPluginState } from '../plugins/bibliography'
import { CitationView } from './citation'
import { CitationEditorWrapper } from './CitationEditorWrapper'
import { createEditableNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'

const createBibliographySection = (node: ManuscriptNode) =>
  schema.nodes.bibliography_section.createAndFill({}, [
    schema.nodes.section_title.create({}, schema.text('Bibliography')),
    schema.nodes.bibliography_element.create({}, node ? [node] : []),
  ]) as ManuscriptNode

export class CitationEditableView extends CitationView<EditableBlockProps> {
  private decoder = new Decoder(new Map())
  private editor: HTMLElement

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
    this.editor?.remove()
    this.dom.classList.remove('ProseMirror-selectednode')
    this.props.popper.destroy()
  }

  public destroy = () => {
    this.editor?.remove()
    this.props.popper.destroy()
  }

  public showPopper = () => {
    const can = this.props.getCapabilities()
    const rids = this.node.attrs.rids
    const bib = getBibliographyPluginState(this.view.state)
    const items = Array.from(bib.bibliographyItems.values())

    if (can.editArticle) {
      const componentProps: CitationEditorProps = {
        rids,
        items,
        citationCounts: bib.citationCounts,
        sources: [crossref],
        handleCite: this.handleCite,
        handleUncite: this.handleUncite,
        handleSave: this.handleSave,
        handleDelete: this.handleDelete,
        handleComment: this.handleComment,
        handleCancel: this.handleCancel,
        canEdit: can.editCitationsAndRefs,
      }

      this.editor = ReactSubView(
        this.props,
        CitationEditorWrapper,
        componentProps,
        this.node,
        this.getPos,
        this.view,
        'citation-editor'
      )
    } else {
      const componentProps: CitationViewerProps = {
        rids,
        items,
      }
      this.editor = ReactSubView(
        this.props,
        CitationViewer,
        componentProps,
        this.node,
        this.getPos,
        this.view,
        'citation-editor'
      )
    }

    this.props.popper.show(this.dom, this.editor, 'right')
  }

  private handleCancel = () => {
    // move the cursor after this node
    const selection = TextSelection.create(
      this.view.state.tr.doc,
      this.getPos() + 1
    )
    this.view.dispatch(this.view.state.tr.setSelection(selection))

    this.props.popper.destroy()
  }

  private handleSave = (item: BibliographyItem) => {
    if (item._id && !this.findPosition(item._id)) {
      this.insertBibliographyNode(item)
    } else {
      const node = this.decoder.decode(item) as BibliographyItemNode
      this.updateNodeAttrs(node.attrs)
    }
  }

  private handleUncite = (id: string) => {
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

  private handleCite = (items: BibliographyItem[]) => {
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
        this.insertBibliographyNode(item)
      }

      citation.embeddedCitationItems.push({
        _id: '_',
        objectType: ObjectTypes.CitationItem,
        bibliographyItem: item._id,
      })
    }

    this.updateNode(citation)

    this.handleCancel()
  }

  private handleDelete = (item: BibliographyItem) => {
    return this.deleteNode(item._id)
  }

  private handleComment = () => {
    const comment = buildComment(this.node.attrs.id) as CommentAnnotation
    this.props.setComment(comment)
  }

  private insertBibliographyNode(item: BibliographyItem) {
    const { doc, tr } = this.view.state

    const elements = findChildrenByType(
      doc,
      schema.nodes.bibliography_element,
      true
    )

    const node = this.decoder.decode(item) as BibliographyItemNode

    if (elements.length) {
      this.view.dispatch(tr.insert(elements[0].pos + 1, node))
    } else {
      this.view.dispatch(
        tr.insert(tr.doc.content.size, createBibliographySection(node))
      )
    }

    return false
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

  private findPosition = (id: string) => {
    const doc = this.view.state.doc
    const children = findChildren(doc, (n) => n.attrs.id === id)
    return children.length ? children[0] : undefined
  }
}

export default createEditableNodeView(CitationEditableView)
