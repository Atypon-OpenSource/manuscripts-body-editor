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
  ContextMenu,
  ContextMenuProps,
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
import { isDeleted } from '../lib/track-changes-utils'
import { deleteNode, updateNodeAttrs } from '../lib/view'
import { getBibliographyPluginState } from '../plugins/bibliography'
import {
  selectedSuggestionKey,
  SET_SUGGESTION_ID,
} from '../plugins/selected-suggestion-ui'
import { CitationView } from './citation'
import { CitationEditorWrapper } from './CitationEditorWrapper'
import { createEditableNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'

const createBibliographySection = (node: ManuscriptNode) =>
  schema.nodes.bibliography_section.createAndFill({}, [
    schema.nodes.section_title.create({}, schema.text('References')),
    schema.nodes.bibliography_element.create({}, node ? [node] : []),
  ]) as ManuscriptNode

export class CitationEditableView extends CitationView<EditableBlockProps> {
  private decoder = new Decoder(new Map())
  private editor: HTMLElement
  private contextMenu: HTMLElement

  public selectNode = () => {
    const dataTracked = this.node.attrs.dataTracked
    const isSelectedSuggestion = !!selectedSuggestionKey
      .getState(this.view.state)
      ?.find(this.getPos(), this.getPos() + this.node.nodeSize).length

    this.dom.classList.add('ProseMirror-selectednode')
    if (dataTracked && !isSelectedSuggestion) {
      this.view.dispatch(
        this.view.state.tr.setMeta(SET_SUGGESTION_ID, dataTracked[0].id)
      )
    } else {
      if (!isDeleted(this.node)) {
        const citation = this.getCitation()
        const rids = citation.embeddedCitationItems.map(
          (i) => i.bibliographyItem
        )

        if (!rids.length) {
          this.showPopper()
        } else {
          this.showContextMenu()
        }
      }
    }
  }

  public deselectNode = () => {
    this.dom.classList.remove('ProseMirror-selectednode')
    this.props.popper.destroy()
  }

  public destroy = () => {
    this.editor?.remove()
    this.props.popper.destroy()
  }

  public showContextMenu = () => {
    this.props.popper.destroy()
    const componentProps: ContextMenuProps = {
      actions: [
        { label: 'Edit', action: this.handleEdit, icon: 'EditIcon' },
        { label: 'Comment', action: this.handleComment, icon: 'AddComment' },
      ],
    }
    this.contextMenu = ReactSubView(
      this.props,
      ContextMenu,
      componentProps,
      this.node,
      this.getPos,
      this.view,
      'context-menu'
    )
    this.props.popper.show(this.dom, this.contextMenu, 'right-start', false)
  }

  public showPopper = () => {
    this.props.popper.destroy() // destroy the context menu
    const can = this.props.getCapabilities()
    const citation = this.getCitation()
    const rids = citation.embeddedCitationItems.map((i) => i.bibliographyItem)
    const bib = getBibliographyPluginState(this.view.state)
    if (!bib) {
      return
    }
    const items = Array.from(bib.bibliographyItems.values())

    if (can.editArticle) {
      const query = this.node.attrs.selectedText
      const componentProps: CitationEditorProps = {
        query,
        rids,
        items,
        citationCounts: bib.citationCounts,
        sources: [crossref],
        onCite: this.handleCite,
        onUncite: this.handleUncite,
        onSave: this.handleSave,
        onDelete: this.handleDelete,
        onComment: this.handleComment,
        onCancel: this.handleCancel,
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
  private handleEdit = () => {
    this.showPopper()
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
      updateNodeAttrs(this.view, node.type, node.attrs)
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
    if (!bib) {
      return
    }

    const citation = this.getCitation()
    const rids = citation.embeddedCitationItems.map((i) => i.bibliographyItem)

    items = items.filter((i) => !rids.includes(i._id))

    for (const item of items) {
      const existingItem = findMatchingBibliographyItem(
        item,
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
    return deleteNode(this.view, item._id)
  }

  private handleComment = () => {
    const comment = buildComment(this.node.attrs.id) as CommentAnnotation
    this.props.setComment(comment)
  }

  private insertBibliographyNode(item: BibliographyItem) {
    const { doc, tr } = this.view.state

    const biblioSection = findChildrenByType(
      doc,
      schema.nodes.bibliography_element,
      true
    )

    const backmatter = findChildrenByType(doc, schema.nodes.backmatter, true)
    const backmatterEnd = backmatter[0]
      ? backmatter[0].node.nodeSize + backmatter[0].pos
      : 0

    const node = this.decoder.decode(item) as BibliographyItemNode

    if (biblioSection.length) {
      this.view.dispatch(tr.insert(biblioSection[0].pos + 1, node))
    } else {
      this.view.dispatch(
        tr.insert(
          backmatterEnd ? backmatterEnd - 1 : tr.doc.content.size,
          createBibliographySection(node)
        )
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
