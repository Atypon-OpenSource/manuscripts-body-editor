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

import { Capabilities, SecondaryButton } from '@manuscripts/style-guide'
import {
  ContributorNode,
  isContributorNode,
  schema,
} from '@manuscripts/transform'

import {
  AuthorsModal,
  AuthorsModalProps,
} from '../components/authors/AuthorsModal'
import { AffiliationAttrs, authorLabel, ContributorAttrs } from '../lib/authors'
import { getActualAttrs } from '../lib/track-changes-utils'
import {
  deleteNode,
  findChildByID,
  findChildByType,
  findChildrenAttrsByType,
  updateNodeAttrs,
} from '../lib/view'
import { affiliationsKey } from '../plugins/affiliations'
import { selectedSuggestionKey } from '../plugins/selected-suggestion-ui'
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

export class ContributorsView<
  PropsType extends ContributorsProps
> extends BlockView<PropsType> {
  container: HTMLElement
  inner: HTMLElement
  popper?: HTMLElement

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
    const selectedSuggestion = selectedSuggestionKey.getState(this.view.state)
    let selectedAuthor: string | undefined
    const authors: ContributorNode[] = []
    const authorsWrapper = document.createElement('div')
    authorsWrapper.classList.add('contributors-list')

    this.node.content?.forEach((node, offset) => {
      if (isContributorNode(node)) {
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
          this.buildAuthor(author, jointAuthors, selectedAuthor)
        )
      })
    this.container.appendChild(authorsWrapper)
  }

  buildAuthor = (
    node: ContributorNode,
    isJointFirstAuthor: boolean,
    selectedAuthor?: string
  ) => {
    const pluginState = affiliationsKey.getState(this.view.state)
    const attrs = node.attrs as TrackableAttributes<ContributorNode>

    const displayAttr = getActualAttrs(node)

    const container = document.createElement('button')
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

    const { isCorresponding, email } = displayAttr

    if (!disableEditButton) {
      container.addEventListener('click', this.handleClick)
    }

    const name = authorLabel(displayAttr)
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

    return container
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
        onClick: this.handleClick,
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

  handleClick = (e: Event) => {
    e.stopPropagation()

    const contributors: ContributorAttrs[] = findChildrenAttrsByType(
      this.view,
      schema.nodes.contributor
    )

    const affiliations: AffiliationAttrs[] = findChildrenAttrsByType(
      this.view,
      schema.nodes.affiliation
    )

    let author = undefined
    const target = e.target as Element
    if (target) {
      const id = target.closest('.contributor')?.getAttribute('id') as string
      author = contributors.filter((a) => a.id === id)[0]
    }

    const componentProps: AuthorsModalProps = {
      author,
      authors: contributors,
      affiliations,
      onSaveAuthor: this.handleSaveAuthor,
      onDeleteAuthor: this.handleDeleteAuthor,
      onSaveAffiliation: this.handleSaveAffiliation,
    }

    this.popper?.remove()

    this.popper = ReactSubView(
      this.props,
      AuthorsModal,
      componentProps,
      this.node,
      this.getPos,
      this.view
    )

    this.container.appendChild(this.popper)
  }

  handleSaveAuthor = (author: ContributorAttrs) => {
    if (!findChildByID(this.view, author.id)) {
      this.insertAuthorNode(author)
    } else {
      updateNodeAttrs(this.view, schema.nodes.contributor, author)
    }
  }

  handleDeleteAuthor = (author: ContributorAttrs) => {
    deleteNode(this.view, author.id)
  }

  handleSaveAffiliation = (affiliation: AffiliationAttrs) => {
    if (!findChildByID(this.view, affiliation.id)) {
      this.insertAffiliationNode(affiliation)
    } else {
      updateNodeAttrs(this.view, schema.nodes.affiliation, affiliation)
    }
  }

  insertAuthorNode = (attrs: ContributorAttrs) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parent = findChildByType(this.view, schema.nodes.contributors)!
    const tr = this.view.state.tr
    const node = schema.nodes.contributor.create(attrs)
    this.view.dispatch(tr.insert(parent.pos + 1, node))
  }

  insertAffiliationNode = (attrs: AffiliationAttrs) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parent = findChildByType(this.view, schema.nodes.affiliations)!
    const tr = this.view.state.tr
    const node = schema.nodes.affiliation.create(attrs)
    this.view.dispatch(tr.insert(parent.pos + 1, node))
  }

  public ignoreMutation = () => true

  public stopEvent = () => true
}

export default createNodeView(ContributorsView)
