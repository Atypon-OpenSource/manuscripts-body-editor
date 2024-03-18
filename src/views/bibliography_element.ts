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
import { ContextMenuProps } from '@manuscripts/style-guide'
import { CHANGE_STATUS, TrackedAttrs } from '@manuscripts/track-changes-plugin'
import {
  BibliographyItemNode,
  buildComment,
  Decoder,
} from '@manuscripts/transform'
import { Decoration } from 'prosemirror-view'

import { sanitize } from '../lib/dompurify'
import {
  getChangeClasses,
} from '../lib/track-changes-utils'
import { deleteNode, updateNode } from '../lib/view'

import { getBibliographyPluginState } from '../plugins/bibliography'
import { commentAnnotation } from '../plugins/comment_annotation'
import {
  CLEAR_SUGGESTION_ID,
  selectedSuggestionKey,
  SET_SUGGESTION_ID,
} from '../plugins/selected-suggestion-ui'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { ContextMenuWrapper } from './ContextMenuWrapper'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'
import { ReferencesEditor, ReferencesEditorProps } from './ReferencesEditor'

interface BibliographyElementViewProps extends BaseNodeProps {
  setComment: (comment?: CommentAnnotation) => void
}
type WidgetDecoration = Decoration & {
  type: { toDOM: () => HTMLElement }
}
export class BibliographyElementBlockView<
  PropsType extends BibliographyElementViewProps & EditableBlockProps
> extends BlockView<PropsType> {
  private container: HTMLElement
  private editor: HTMLDivElement
  private decoder = new Decoder(new Map())
  private elementWithContextMenu: Element | null = null // for storing element which should have context menu displayed

  public showPopper = (id: string) => {
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
    this.props.popper.destroy() // destroy the context menu
    this.showPopper(citationId)
  }

  private handleComment = (citationId: string) => {
    this.props.setComment(buildComment(citationId) as CommentAnnotation)
  }

  public showContextMenu = (element: Element) => {
    const componentProps: ContextMenuProps = {
      actions: [
        {
          label: 'Edit',
          action: () => this.handleEdit(element.id),
          icon: 'EditIcon',
        },
        {
          label: 'Comment',
          action: () => this.handleComment(element.id),
          icon: 'AddComment',
        },
      ],
    }

    this.editor = ReactSubView(
      this.props,
      ContextMenuWrapper,
      componentProps,
      this.node,
      this.getPos,
      this.view,
      'context-menu'
    )
    this.props.popper.show(element, this.editor, 'right-start')
  }

  private onClickHandler = (element: Element, dataTracked?: TrackedAttrs) => {
    this.elementWithContextMenu = null
    this.props.popper.destroy() // destroy the old context menu
    this.elementWithContextMenu = element
    this.view.dispatch(this.view.state.tr.setMeta(CLEAR_SUGGESTION_ID, true))
    if (dataTracked && dataTracked.status !== CHANGE_STATUS.rejected) {
      this.view.dispatch(
        this.view.state.tr
          .setMeta(CLEAR_SUGGESTION_ID, false)
          .setMeta(SET_SUGGESTION_ID, dataTracked.id)
      )
    }
  }

  public updateContents = async () => {
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
        element.addEventListener(
          'click',
          () => this.onClickHandler(element, dataTracked),
          false
        )
      }
      // set current element with corresponding id which should have context menu displayed
      if (element.id === this.elementWithContextMenu?.id) {
        this.elementWithContextMenu = element
      }
      wrapper.append(element)
    }

    const oldContent = this.container.querySelector('.contents')
    if (oldContent) {
      this.container.replaceChild(wrapper, oldContent)
    } else {
      this.container.appendChild(wrapper)
    }

    // if there is an element to click after rerender, show ContextMenu
    if (this.elementWithContextMenu) {
      this.showContextMenu(this.elementWithContextMenu)
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
    updateNode(this.view, node)
  }

  private handleDelete = (item: BibliographyItem) => {
    deleteNode(this.view, item._id)
  }
}

export default createNodeView(BibliographyElementBlockView)
