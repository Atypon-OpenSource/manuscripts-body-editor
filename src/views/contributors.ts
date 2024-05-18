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

import {
  ContextMenu,
  ContextMenuProps,
  SecondaryButton,
} from '@manuscripts/style-guide'
import {
  ContributorNode, isContributorNode,
  schema,
} from '@manuscripts/transform'

import {
  AuthorsModal,
  AuthorsModalProps,
} from '../components/authors/AuthorsModal'
import {
  deleteNode,
  findChildByID,
  findChildByType,
  findChildrenAttrsByType,
  updateNodeAttrs,
} from '../lib/view'
import { affiliationsKey } from '../plugins/affiliations'
import BlockView from './block_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'
import {getActualAttrs} from "../lib/track-changes-utils";
import {TrackableAttributes} from "../types";
import {AffiliationAttrs, authorLabel, ContributorAttrs} from "../lib/authors";
import {EditableBlockProps} from "./editable_block";

export class ContributorsView extends BlockView<EditableBlockProps> {
  contextMenu: HTMLElement
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
    setTimeout(() => {
      this.updateClasses()
      this.updateAttributes()
      this.container.innerHTML = ''
      this.buildAuthors()
      this.createEditButton()
      this.createLegend()
    }, 0)
  }

  buildAuthors = () => {
    const authors: ContributorNode[] = []
    const authorsWrapper = document.createElement('div')
    authorsWrapper.classList.add('contributors-list')

    this.node.content?.forEach((node, offset) => {
      if (isContributorNode(node)) {
        authors.push(node)
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
          this.buildAuthor(author, jointAuthors)
        )
      })
    this.container.appendChild(authorsWrapper)
  }

  buildAuthor = (
    node: ContributorNode,
    isJointFirstAuthor: boolean,
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

    const { isCorresponding, email } = displayAttr

    if (can.editMetadata) {
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

    containerWrapper.appendChild(container)
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
        onClick: () => this.handleEdit(''),
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

  private handleClick = (event: Event) => {
    this.props.popper.destroy()
    const element = event.target as HTMLElement
    const author = element.closest('.contributor')
    if (author) {
      this.showContextMenu(author.id)
    }
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

  handleEdit = (id: string) => {
    this.props.popper.destroy()

    const contributors: ContributorAttrs[] = findChildrenAttrsByType(
      this.view,
      schema.nodes.contributor
    )

    const affiliations: AffiliationAttrs[] = findChildrenAttrsByType(
      this.view,
      schema.nodes.affiliation
    )

    const author = id ? contributors.filter((a) => a.id === id)[0] : undefined

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
    const update = updateNodeAttrs(this.view, schema.nodes.contributor, author)
    if (!update) {
      this.insertAuthorNode(author)
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
}

export default createNodeView(ContributorsView)
