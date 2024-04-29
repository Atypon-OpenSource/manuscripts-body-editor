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

import { BibliographyItem, CommentAnnotation } from '@manuscripts/json-schema'
import { ContextMenu, ContextMenuProps } from '@manuscripts/style-guide'
import { CHANGE_STATUS, TrackedAttrs } from '@manuscripts/track-changes-plugin'
import {
  BibliographyItemNode,
  buildComment,
  Decoder,
} from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'
import { Decoration } from 'prosemirror-view'

import { sanitize } from '../lib/dompurify'
import { getChangeClasses } from '../lib/track-changes-utils'
import { deleteNode, updateNodeAttrs } from '../lib/view'
import { getBibliographyPluginState } from '../plugins/bibliography'
import { commentAnnotation } from '../plugins/comment_annotation'
import {
  CLEAR_SUGGESTION_ID,
  selectedSuggestionKey,
  SET_SUGGESTION_ID,
} from '../plugins/selected-suggestion-ui'
import { WidgetDecoration } from '../types'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'
import { ReferencesEditor, ReferencesEditorProps } from './ReferencesEditor'

interface BibliographyElementViewProps extends BaseNodeProps {
  setComment: (comment?: CommentAnnotation) => void
}

export class BibliographyElementBlockView<
  PropsType extends BibliographyElementViewProps & EditableBlockProps
> extends BlockView<PropsType> {
  private container: HTMLElement
  private editor: HTMLDivElement
  private contextMenu: HTMLDivElement
  private decoder = new Decoder(new Map())
  private clickedElementId: string | null = null // for storing element.id which should have context menu displayed

  public showPopper = (id: string) => {
    this.props.popper.destroy() // destroy the old context menu
    const bib = getBibliographyPluginState(this.view.state)

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

  private handleComment = (citationId: string) => {
    this.props.setComment(buildComment(citationId) as CommentAnnotation)
  }

  public showContextMenu = (elementId: string) => {
    this.props.popper.destroy() // destroy the old context menu
    this.clickedElementId = null // reset clicked element id
    const can = this.props.getCapabilities()
    const element = document.getElementById(elementId) as Element
    const componentProps: ContextMenuProps = {
      actions: [],
    }
    if (can.editCitationsAndRefs) {
      componentProps.actions.push({
        label: 'Edit',
        action: () => this.handleEdit(elementId),
        icon: 'EditIcon',
      })
    }
    componentProps.actions.push({
      label: 'Comment',
      action: () => this.handleComment(elementId),
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

  private onClickHandler = (elementId: string, dataTracked?: TrackedAttrs) => {
    // store clicked element
    this.clickedElementId = elementId
    const isSelectedSuggestion = !!selectedSuggestionKey
      .getState(this.view.state)
      ?.find(this.getPos(), this.getPos() + this.node.nodeSize).length
    const { tr, doc } = this.view.state
    tr.setSelection(NodeSelection.create(doc, this.getPos()))
    if (dataTracked && dataTracked.status !== CHANGE_STATUS.rejected) {
      tr.setMeta(SET_SUGGESTION_ID, dataTracked.id)
    } else {
      if (isSelectedSuggestion) {
        tr.setMeta(CLEAR_SUGGESTION_ID, true)
      } else {
        this.showContextMenu(elementId)
      }
    }
    this.view.dispatch(tr)
  }

  public updateContents = async () => {
    this.props.popper.destroy() // destroy the old context menu
    const bib = getBibliographyPluginState(this.view.state)
    const commentsDecorationSet = commentAnnotation.getState(this.view.state)
    const selectedSuggestion = selectedSuggestionKey.getState(this.view.state)
    const commentElementMap: Map<string, HTMLElement> = new Map()
    const dataTrackedMap: Map<string, TrackedAttrs> = new Map()
    let selectedBibItemSuggestion

    this.node.descendants((node, pos) => {
      const nodePosition = this.getPos() + pos + 2
      if (commentsDecorationSet) {
        const commentWidget = commentsDecorationSet.find(
          nodePosition,
          nodePosition
        )
        if (commentWidget.length) {
          const commentElement = (
            commentWidget[0] as WidgetDecoration
          ).type.toDOM()

          commentElementMap.set(commentElement.id, commentElement)
        }
      }

      const dataTracked = node.attrs.dataTracked as TrackedAttrs[]

      if (dataTracked?.length) {
        const lastChange = dataTracked[dataTracked.length - 1]
        dataTrackedMap.set(node.attrs.id, lastChange)
      }

      if (
        dataTracked?.length &&
        selectedSuggestion?.find(nodePosition, nodePosition + node.nodeSize)
          .length
      ) {
        selectedBibItemSuggestion = node.attrs.id
      }
    })

    const can = this.props.getCapabilities()

    const wrapper = document.createElement('div')
    wrapper.classList.add('contents')

    const [meta, bibliography] = bib.provider.makeBibliography()

    for (let i = 0; i < bibliography.length; i++) {
      const id = meta.entry_ids[i]
      const fragment = bibliography[i]
      const element = sanitize(
        `<div id="${id}" class="bib-item"><div class="csl-bib-body">${fragment}</div></div>`
      ).firstElementChild as Element

      const commentElement = commentElementMap.get(element.id)

      if (commentElement) {
        element.appendChild(commentElement)
      }

      const dataTracked = dataTrackedMap.get(element.id)
      if (dataTracked) {
        element.classList.add(
          'attrs-track-mark',
          ...getChangeClasses([dataTracked])
        )
      }

      if (
        selectedBibItemSuggestion &&
        selectedBibItemSuggestion === element.id
      ) {
        element.classList.add('selected-suggestion')
      }

      if (can.seeReferencesButtons) {
        element.addEventListener('click', () =>
          this.onClickHandler(element.id, dataTracked)
        )
      }

      wrapper.append(element)
    }

    const oldContent = this.container.querySelector('.contents')
    if (oldContent) {
      this.container.replaceChild(wrapper, oldContent)
    } else {
      this.container.appendChild(wrapper)
    }

    // if there is an element which was clicked, show ContextMenu
    if (this.clickedElementId) {
      this.showContextMenu(this.clickedElementId)
    }
  }

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block')
    this.container.contentEditable = 'false'

    this.dom.setAttribute('contenteditable', 'false')
    this.dom.appendChild(this.container)
  }

  private handleSave = (item: BibliographyItem) => {
    const node = this.decoder.decode(item) as BibliographyItemNode
    updateNodeAttrs(this.view, node.type, node.attrs)
  }

  private handleDelete = (item: BibliographyItem) => {
    deleteNode(this.view, item._id)
  }
}

export default createNodeView(BibliographyElementBlockView)
