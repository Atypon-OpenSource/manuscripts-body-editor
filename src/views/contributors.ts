/*!
 * © 2023 Atypon Systems LLC
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
import {
  Capabilities,
  ContextMenu,
  ContextMenuProps,
  SecondaryButton,
} from '@manuscripts/style-guide'
import { CHANGE_STATUS, TrackedAttrs } from '@manuscripts/track-changes-plugin'
import {
  buildComment,
  ContributorNode,
  isContributorNode,
} from '@manuscripts/transform'
import { Decoration } from 'prosemirror-view'

import { getActualAttrs } from '../lib/track-changes-utils'
import { affiliationsKey } from '../plugins/affiliations'
import { commentAnnotation } from '../plugins/comment_annotation'
import {
  CLEAR_SUGGESTION_ID,
  selectedSuggestionKey,
  SET_SUGGESTION_ID,
} from '../plugins/selected-suggestion-ui'
import { TrackableAttributes } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'

export interface ContributorsProps extends EditableBlockProps {
  getCapabilities: () => Capabilities
  openAuthorEditing: () => void
  selectAuthorForEditing: (authorId: string) => void
}
type WidgetDecoration = Decoration & {
  type: { toDOM: () => HTMLElement }
}
export class ContributorsView<
  PropsType extends ContributorsProps
> extends BlockView<PropsType> {
  contextMenu: HTMLElement
  container: HTMLElement
  inner: HTMLElement

  public initialise = () => {
    this.createDOM()
    this.createGutter('block-gutter', this.gutterButtons().filter(Boolean))
    this.createElement()
    this.createGutter(
      'action-gutter',
      this.actionGutterButtons().filter(Boolean)
    )
    this.updateContents()
  }

  public updateContents = () => {
    this.updateClasses()
    this.updateAttributes()
    this.container.innerHTML = ''
    this.buildAuthors()
    this.createEditButton()
    this.createLegend()
  }

  buildAuthors = () => {
    const commentsDecorationSet = commentAnnotation.getState(this.view.state)
    const commentElementMap: Map<string, HTMLElement> = new Map()
    const selectedSuggestion = selectedSuggestionKey.getState(this.view.state)
    let selectedAuthor: string | undefined
    const authors: ContributorNode[] = []
    const authorsWrapper = document.createElement('div')
    authorsWrapper.classList.add('contributors-list')

    this.node.content?.forEach((node, offset) => {
      if (isContributorNode(node)) {
        if (commentsDecorationSet) {
          const commentWidget = commentsDecorationSet.find(
            this.getPos() + offset + 2,
            this.getPos() + offset + 2
          )
          if (commentWidget.length) {
            const commentElement = (
              commentWidget[0] as WidgetDecoration
            ).type.toDOM()

            commentElementMap.set(commentElement.id, commentElement)
          }
        }

        authors.push(node)

        if (
          selectedSuggestion?.find(
            this.getPos() + offset + 2,
            this.getPos() + offset + node.nodeSize + 2
          ).length
        ) {
          selectedAuthor = node.attrs.id
        }
      }
    })

    authors
      .sort((a, b) => Number(a.attrs.priority) - Number(b.attrs.priority))
      .forEach((author, i) => {
        if (getActualAttrs(author).role !== 'author') {
          return
        }
        const jointAuthors = this.isJointFirstAuthor(authors, i)
        authorsWrapper.appendChild(
          this.buildAuthor(
            author,
            jointAuthors,
            commentElementMap,
            selectedAuthor
          )
        )
      })
    this.container.appendChild(authorsWrapper)
  }

  buildAuthor = (
    node: ContributorNode,
    isJointFirstAuthor: boolean,
    commentElementMap: Map<string, HTMLElement>,
    selectedAuthor?: string
  ) => {
    const pluginState = affiliationsKey.getState(this.view.state)
    const attrs = node.attrs as TrackableAttributes<ContributorNode>

    const displayAttr = getActualAttrs(node)

    const containerWrapper = document.createElement('div')
    const container = document.createElement('button')
    containerWrapper.classList.add('contributor-wrapper')
    container.classList.add('contributor')
    container.setAttribute('id', attrs.id)
    container.setAttribute('contenteditable', 'false')

    if (attrs.dataTracked?.length) {
      container.setAttribute('data-track-id', attrs.dataTracked[0].id)
      container.setAttribute('data-track-status', attrs.dataTracked[0].status)
      container.setAttribute('data-track-op', attrs.dataTracked[0].operation)
    } else {
      container.removeAttribute('data-track-id')
      container.removeAttribute('data-track-status')
      container.removeAttribute('data-track-type')
    }

    const can = this.props.getCapabilities()

    const disableEditButton = !can.editMetadata

    const { bibliographicName, isCorresponding, email, id } = displayAttr

    container.addEventListener('click', (e) => {
      e.preventDefault()
      if (!disableEditButton) {
        const dataTracked = attrs.dataTracked as TrackedAttrs[]
        this.onClickHandler(id, dataTracked ? dataTracked[0] : undefined)
      }
    })

    const name = this.buildNameLiteral(bibliographicName)
    container.innerHTML =
      isCorresponding && email
        ? `<span class="name">${name} (${email})</span>`
        : `<span class="name">${name}</span>`

    const noteText: string[] = []
    if (pluginState?.indexedAffiliationIds) {
      displayAttr.affiliations.map((af) => {
        const index = pluginState?.indexedAffiliationIds.get(af)
        if (index) {
          noteText.push(index.toString())
        }
      })
    }

    if (isJointFirstAuthor) {
      container.appendChild(this.createNote('†', 'Joint contributor'))
    }

    if (noteText) {
      container.appendChild(this.createNote(noteText.join(',')))
    }

    if (displayAttr.isCorresponding) {
      container.appendChild(this.createNote('*', 'Corresponding author'))
    }

    if (selectedAuthor && selectedAuthor === attrs.id) {
      container.classList.add('selected-suggestion')
    }

    containerWrapper.appendChild(container)
    const commentElement = commentElementMap.get(attrs.id)
    commentElement?.classList.add('ProseMirror-widget')

    if (commentElement) {
      container.after(commentElement)
    }
    return containerWrapper
  }

  createNote(text = '', title = '') {
    const el = document.createElement('span')
    el.innerHTML = text
    if (title) {
      el.setAttribute('title', title)
    }
    el.classList.add('contributor-note')
    return el
  }

  initials = (given: string): string =>
    given
      ? given
          .trim()
          .split(' ')
          .map((part) => part.substr(0, 1).toUpperCase() + '.')
          .join('')
      : ''

  buildNameLiteral = ({ given = '', family = '', suffix = '' }) => {
    if (!given && !family) {
      return 'Unknown Author'
    }
    return [this.initials(given), family, suffix]
      .filter((part) => part)
      .join(' ')
  }

  public isJointFirstAuthor = (authors: ContributorNode[], index: number) => {
    const author = index === 0 ? authors[index] : authors[index - 1]

    return Boolean(author.attrs.isJointContributor)
  }

  public createElement = () => {
    this.inner = document.createElement('div')
    this.inner.classList.add('authors-container', 'block')
    this.dom.appendChild(this.inner)

    this.container = document.createElement('div')
    this.container.classList.add('contributors')
    this.inner.appendChild(this.container)
  }

  public createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('block-container', `block-${this.node.type.name}`)
  }

  createEditButton = () => {
    const can = this.props.getCapabilities()

    const button = ReactSubView(
      this.props,
      SecondaryButton,
      {
        mini: true,
        onClick: this.props.openAuthorEditing,
        className: 'edit-authors-button',
        disabled: !can.editMetadata,
        children: 'Edit Authors',
      },
      this.node,
      this.getPos,
      this.view
    )
    this.container.appendChild(button)
  }

  createLegend = () => {
    const state = affiliationsKey.getState(this.view.state)
    if (state?.contributors) {
      const isThereJointContributor = state.contributors.find(
        ([contributor]) => contributor.attrs.isJointContributor
      )
      if (isThereJointContributor) {
        const element = document.createElement('p')
        element.classList.add('contributors-legend')
        element.innerHTML =
          '<span class="symbol">†</span>These authors contributed equally to this work.'
        this.container.appendChild(element)
      }
    }
  }

  private onClickHandler = (elementId: string, dataTracked?: TrackedAttrs) => {
    const isSelectedSuggestion = !!selectedSuggestionKey
      .getState(this.view.state)
      ?.find(this.getPos(), this.getPos() + this.node.nodeSize).length

    if (dataTracked && dataTracked.status !== CHANGE_STATUS.rejected) {
      this.view.dispatch(
        this.view.state.tr.setMeta(SET_SUGGESTION_ID, dataTracked.id)
      )
    } else {
      if (isSelectedSuggestion) {
        this.view.dispatch(
          this.view.state.tr.setMeta(CLEAR_SUGGESTION_ID, true)
        )
      }
    }

    this.showContextMenu(elementId)
  }

  private handleEdit = (id: string) => {
    this.props.openAuthorEditing()
    this.props.selectAuthorForEditing(id)
  }

  private handleComment = (id: string) => {
    const comment = buildComment(id) as CommentAnnotation
    this.props.setComment(comment)
  }

  public showContextMenu = (elementId: string) => {
    this.props.popper.destroy() // destroy the old context menu
    const element = document.getElementById(elementId) as Element
    const componentProps: ContextMenuProps = {
      actions: [
        {
          label: 'Edit',
          action: () => this.handleEdit(elementId),
          icon: 'EditIcon',
        },
        {
          label: 'Comment',
          action: () => this.handleComment(elementId),
          icon: 'AddComment',
        },
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
    this.props.popper.show(element, this.contextMenu, 'right-start')
  }

  public ignoreMutation = () => true

  public stopEvent = () => true
}

export default createNodeView(ContributorsView)
