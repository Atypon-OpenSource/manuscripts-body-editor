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
import { ReferencesEditorProps } from '@manuscripts/style-guide'
import {
  CHANGE_OPERATION,
  CHANGE_STATUS,
  TrackedAttrs,
} from '@manuscripts/track-changes-plugin'
import {
  BibliographyItemNode,
  buildComment,
  Decoder,
} from '@manuscripts/transform'
import { Decoration } from 'prosemirror-view'

import { commentIcon, editIcon } from '../assets'
import { sanitize } from '../lib/dompurify'
import { getBibliographyPluginState } from '../plugins/bibliography'
import { commentAnnotation } from '../plugins/comment_annotation'
import {
  getAttrsTrackingButton,
  getMarkDecoration,
} from '../plugins/tracking-mark'
import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'
import { ReferencesEditorWrapper } from './ReferencesEditorWrapper'

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

  public gutterButtons = (): HTMLElement[] => []

  public showPopper = (id: string) => {
    const bib = getBibliographyPluginState(this.view.state)

    const componentProps: ReferencesEditorProps = {
      items: Array.from(bib.bibliographyItems.values()),
      citationCounts: bib.citationCounts,
      item: bib.bibliographyItems.get(id),
      handleSave: this.handleSave,
      handleDelete: this.handleDelete,
    }

    this.editor = ReactSubView(
      this.props,
      ReferencesEditorWrapper,
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

  public updateContents = async () => {
    const bib = getBibliographyPluginState(this.view.state)
    const commentsDecorationSet = commentAnnotation.getState(this.view.state)
    const commentElementMap: Map<string, HTMLElement> = new Map()
    const dataTrackedMap: Map<string, TrackedAttrs> = new Map()

    this.node.descendants((node, pos) => {
      if (commentsDecorationSet) {
        const nodePosition = this.getPos() + pos + 2
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

    const [meta, bibliography] = bib.provider.makeBibliography()

    for (let i = 0; i < bibliography.length; i++) {
      const id = meta.entry_ids[i]
      const fragment = bibliography[i]
      const element = sanitize(
        `<div id="${id}" class="bib-item"><div class="csl-bib-body">${fragment}</div></div>`
      ).firstElementChild as Element

      const doubleButton = document.createElement('div')
      const editButton = document.createElement('button')
      const commentButton = document.createElement('button')

      doubleButton.className = 'bibliography-double-button'
      editButton.className = 'bibliography-edit-button'
      commentButton.className = 'bibliography-comment-button'

      commentButton.addEventListener('click', (e) => {
        e.preventDefault()
        this.props.setComment(buildComment(element.id) as CommentAnnotation)
      })

      editButton.addEventListener('click', (e) => {
        e.preventDefault()
        this.showPopper(element.id)
      })

      editButton.innerHTML = editIcon
      commentButton.innerHTML = commentIcon
      doubleButton.append(editButton, commentButton)

      if (
        can.seeReferencesButtons &&
        !element.querySelector('.bibliography-double-button')
      ) {
        element.appendChild(doubleButton)
      }

      editButton.disabled = !can.editCitationsAndRefs

      const commentElement = commentElementMap.get(element.id)

      if (commentElement) {
        element.appendChild(commentElement)
      }

      const dataTracked = dataTrackedMap.get(element.id)

      if (dataTracked) {
        element.classList.add('attrs-track-mark')
        const decoration = getMarkDecoration(dataTracked)

        decoration.style && element.setAttribute('style', decoration.style)

        if (
          dataTracked.status === CHANGE_STATUS.pending &&
          dataTracked.operation === CHANGE_OPERATION.set_node_attributes
        ) {
          element.appendChild(getAttrsTrackingButton(dataTracked.id))
        }
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

  private handleSave = (item: BibliographyItem) => {
    const node = this.decoder.decode(item) as BibliographyItemNode
    this.updateNodeAttrs(node.attrs)
  }

  private handleDelete = (item: BibliographyItem) => {
    return this.deleteNode(item._id)
  }
}

export default createNodeView(BibliographyElementBlockView)
