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

import { CommentAnnotation } from '@manuscripts/json-schema'
import { ContextMenu, ContextMenuProps } from '@manuscripts/style-guide'
import { TrackedAttrs } from '@manuscripts/track-changes-plugin'
import { buildComment, schema } from '@manuscripts/transform'

import {
  ReferencesEditor,
  ReferencesEditorProps,
} from '../components/references/ReferencesEditor'
import { sanitize } from '../lib/dompurify'
import { BibliographyItemAttrs } from '../lib/references'
import { getChangeClasses } from '../lib/track-changes-utils'
import { deleteNode, updateNodeAttrs } from '../lib/view'
import { getBibliographyPluginState } from '../plugins/bibliography'
import { commentAnnotation } from '../plugins/comment_annotation'
import { WidgetDecoration } from '../types'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'

interface BibliographyElementViewProps extends BaseNodeProps {
  setComment: (comment?: CommentAnnotation) => void
}

export class BibliographyElementBlockView<
  PropsType extends BibliographyElementViewProps & EditableBlockProps
> extends BlockView<PropsType> {
  private container: HTMLElement
  private editor: HTMLDivElement
  private contextMenu: HTMLDivElement

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

  private handleComment = (citationId: string) => {
    this.props.setComment(buildComment(citationId) as CommentAnnotation)
  }

  public showContextMenu = (element: HTMLElement) => {
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
      this.showContextMenu(item as HTMLElement)
    }
  }

  public updateContents = async () => {
    this.props.popper.destroy() // destroy the old context menu
    const bib = getBibliographyPluginState(this.view.state)
    if (!bib) {
      return
    }

    const commentsDecorationSet = commentAnnotation.getState(this.view.state)
    const commentElementMap: Map<string, HTMLElement> = new Map()
    const dataTrackedMap: Map<string, TrackedAttrs> = new Map()

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

      const commentElement = commentElementMap.get(element.id)

      if (commentElement) {
        element.appendChild(commentElement)
      }
      const dataTracked = dataTrackedMap.get(element.id)
      if (dataTracked) {
        element.classList.add(...getChangeClasses([dataTracked]))
        element.dataset.trackId = dataTracked.id
      }

      wrapper.append(element)
    }

    const oldContent = this.container.querySelector('.contents')
    if (oldContent) {
      this.container.replaceChild(wrapper, oldContent)
    } else {
      this.container.appendChild(wrapper)
    }
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
}

export default createNodeView(BibliographyElementBlockView)
