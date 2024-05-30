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

import { ContextMenu, ContextMenuProps } from '@manuscripts/style-guide'
import { TrackedAttrs } from '@manuscripts/track-changes-plugin'
import { buildComment, schema } from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'

import { addNodeComment } from '../commands'
import {
  ReferencesEditor,
  ReferencesEditorProps,
} from '../components/references/ReferencesEditor'
import { getCommentIconForNode, getCommentIDForNode } from '../lib/comments'
import { sanitize } from '../lib/dompurify'
import { BibliographyItemAttrs } from '../lib/references'
import { getChangeClasses } from '../lib/track-changes-utils'
import { deleteNode, findChildByID, updateNodeAttrs } from '../lib/view'
import { getBibliographyPluginState } from '../plugins/bibliography'
import { commentAnnotation } from '../plugins/comment_annotation'
import { selectedSuggestionKey } from '../plugins/selected-suggestion'
import { WidgetDecoration } from '../types'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'

export class BibliographyElementBlockView<
  PropsType extends EditableBlockProps
> extends BlockView<PropsType> {
  private container: HTMLElement
  private editor: HTMLDivElement
  private contextMenu: HTMLDivElement
  private version: string

  public showPopper = (id: string) => {
    this.props.popper.destroy() // destroy the old context menu
    const bib = getBibliographyPluginState(this.view.state)

    if (!bib) {
      return
    }

    const componentProps: ReferencesEditorProps = {
      items: Array.from(bib.bibliographyItems.values()),
      citationCounts: bib.citationCounts,
      item: bib.bibliographyItems.get(id),
      onSave: this.handleSave,
      onDelete: this.handleDelete,
    }

    this.editor = ReactSubView(
      this.props,
      ReferencesEditor,
      componentProps,
      this.node,
      this.getPos,
      this.view,
      'references-modal'
    )

    this.props.popper.show(this.dom, this.editor, 'right')
  }

  public stopEvent = () => true

  public ignoreMutation = () => true

  private handleEdit = (citationId: string) => {
    this.showPopper(citationId)
  }

  private handleComment = (itemID: string) => {
    const item = findChildByID(this.view, itemID)
    if (item) {
      addNodeComment(item.node, this.view.state, this.props.dispatch)
    }
  }

  private showContextMenu = (element: HTMLElement) => {
    this.props.popper.destroy() // destroy the old context menu
    const can = this.props.getCapabilities()
    const componentProps: ContextMenuProps = {
      actions: [],
    }
    if (can.editCitationsAndRefs) {
      componentProps.actions.push({
        label: 'Edit',
        action: () => this.handleEdit(element.id),
        icon: 'EditIcon',
      })
    }
    componentProps.actions.push({
      label: 'Comment',
      action: () => this.handleComment(element.id),
      icon: 'AddComment',
    })

    this.contextMenu = ReactSubView(
      this.props,
      ContextMenu,
      componentProps,
      this.node,
      this.getPos,
      this.view,
      'context-menu'
    )
    this.props.popper.show(element, this.contextMenu, 'right-start')
  }

  private handleClick = (event: Event) => {
    this.props.popper.destroy()
    const element = event.target as HTMLElement
    const item = element.closest('.bib-item')
    if (item) {
      const marker = element.closest('.comment-icon')
      if (marker) {
        const commentID = getCommentIDForNode(item.id)
        this.props.setSelectedComment(commentID)
        return
      }
      this.showContextMenu(item as HTMLElement)
      const node = findChildByID(this.view, item.id)
      if (!node) {
        return
      }
      const view = this.view
      const tr = view.state.tr
      tr.setSelection(NodeSelection.create(view.state.doc, node.pos))
      view.dispatch(tr)
    }
  }

  public updateContents = () => {
    this.props.popper.destroy() // destroy the old context menu
    const bib = getBibliographyPluginState(this.view.state)
    if (!bib) {
      return
    }

    if (bib.version === this.version) {
      this.updateSelection()
      return
    }
    this.version = bib.version

    const nodes: Map<string, BibliographyItemNode> = new Map()

    this.node.descendants((node) => {
      const id = node.attrs.id
      nodes.set(id, node as BibliographyItemNode)
    })

    const can = this.props.getCapabilities()

    const wrapper = document.createElement('div')
    wrapper.classList.add('contents')
    if (can.seeReferencesButtons) {
      wrapper.addEventListener('click', this.handleClick)
    }

    const [meta, bibliography] = bib.provider.makeBibliography()

    for (let i = 0; i < bibliography.length; i++) {
      const id = meta.entry_ids[i][0]
      const fragment = bibliography[i]
      const element = sanitize(
        `<div id="${id}" class="bib-item"><div class="csl-bib-body">${fragment}</div></div>`
      ).firstElementChild as HTMLElement

      const node = nodes.get(id) as BibliographyItemNode
      const comment = getCommentIconForNode(this.view.state, node)
      if (comment) {
        element.appendChild(comment)
      }

      const attrs = node.attrs as BibliographyItemAttrs
      element.classList.add(
        'attrs-track-mark',
        ...getChangeClasses(attrs.dataTracked)
      )

      wrapper.append(element)
    }

    const oldContent = this.container.querySelector('.contents')
    if (oldContent) {
      this.container.replaceChild(wrapper, oldContent)
    } else {
      this.container.appendChild(wrapper)
    }
    this.updateSelection()
  }

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block')
    this.container.contentEditable = 'false'

    this.dom.setAttribute('contenteditable', 'false')
    this.dom.appendChild(this.container)
  }

  private handleSave = (attrs: BibliographyItemAttrs) => {
    updateNodeAttrs(this.view, schema.nodes.bibliography_item, attrs)
  }

  private handleDelete = (item: BibliographyItemAttrs) => {
    deleteNode(this.view, item.id)
  }

  private updateSelection = () => {
    const selection = selectedSuggestionKey.getState(
      this.view.state
    )?.suggestion
    this.container
      .querySelectorAll('.bib-item')
      .forEach((e) => e.classList.remove('selected-suggestion'))
    if (selection) {
      const item = this.container.querySelector(
        `[data-track-id="${selection.id}"]`
      )
      item?.classList.add('selected-suggestion')
    }
  }
}

export default createNodeView(BibliographyElementBlockView)
