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
import { schema } from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'

import {
  AuthorsModal,
  AuthorsModalProps,
} from '../components/authors/AuthorsModal'
import {
  AffiliationAttrs,
  authorComparator,
  authorLabel,
  ContributorAttrs,
} from '../lib/authors'
import { isDeleted } from '../lib/track-changes-utils'
import {
  deleteNode,
  findChildByID,
  findChildByType,
  findChildrenAttrsByType,
  updateNodeAttrs,
} from '../lib/view'
import { affiliationsKey, PluginState } from '../plugins/affiliations'
import { selectedSuggestionKey } from '../plugins/selected-suggestion'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'

export class ContributorsView extends BlockView<EditableBlockProps> {
  contextMenu: HTMLElement
  container: HTMLElement
  inner: HTMLElement
  popper?: HTMLElement
  version: string

  public ignoreMutation = () => true
  public stopEvent = () => true

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
    const affs = affiliationsKey.getState(this.view.state)
    if (!affs) {
      return
    }
    if (affs.version === this.version) {
      this.updateSelection()
      return
    }
    this.version = affs.version
    this.container.innerHTML = ''
    this.buildAuthors(affs)
    this.createEditButton()
    this.createLegend()
    this.updateSelection()
  }

  public selectNode = () => {
    this.dom.classList.add('ProseMirror-selectednode')
    if (!isDeleted(this.node)) {
      this.handleEdit('')
    }
  }

  buildAuthors = (affs: PluginState) => {
    const wrapper = document.createElement('div')
    wrapper.classList.add('contributors-list')

    const can = this.props.getCapabilities()
    if (can.editMetadata) {
      wrapper.addEventListener('click', this.handleClick)
    }

    const authors = affs.contributors

    authors.sort(authorComparator).forEach((author, i) => {
      if (author.role !== 'author') {
        return
      }
      const jointAuthors = this.isJointFirstAuthor(authors, i)
      wrapper.appendChild(this.buildAuthor(author, jointAuthors))
      if (i !== authors.length - 1) {
        const separator = document.createElement('span')
        separator.classList.add('separator')
        separator.innerHTML = ','
        wrapper.appendChild(separator)
      }
    })

    this.container.appendChild(wrapper)
  }

  buildAuthor = (attrs: ContributorAttrs, isJointFirstAuthor: boolean) => {
    const state = this.view.state
    const affs = affiliationsKey.getState(state)?.indexedAffiliationIds

    const container = document.createElement('span')
    container.classList.add('contributor')
    container.setAttribute('id', attrs.id)
    container.setAttribute('contenteditable', 'false')

    if (attrs.dataTracked?.length) {
      const change = attrs.dataTracked[0]
      container.setAttribute('data-track-id', change.id)
      container.setAttribute('data-track-status', change.status)
      container.setAttribute('data-track-op', change.operation)
    }

    const name = authorLabel(attrs)
    container.innerHTML =
      attrs.isCorresponding && attrs.email
        ? `<span class="name">${name} (${attrs.email})</span>`
        : `<span class="name">${name}</span>`

    const noteText: string[] = []
    if (affs) {
      attrs.affiliations.map((a) => {
        const index = affs.get(a)
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

    if (attrs.isCorresponding) {
      container.appendChild(this.createNote('*', 'Corresponding author'))
    }

    return container
  }

  private createNote(text = '', title = '') {
    const note = document.createElement('span')
    note.innerHTML = text
    if (title) {
      note.setAttribute('title', title)
    }
    note.classList.add('contributor-note')
    return note
  }

  private isJointFirstAuthor = (authors: ContributorAttrs[], index: number) => {
    const author = index === 0 ? authors[index] : authors[index - 1]
    return Boolean(author.isJointContributor)
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
        (attrs) => attrs.isJointContributor
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
    if (!author) {
      return
    }
    const { node, pos } = findChildByID(this.view, author.id) || {}
    if (!node || !pos) {
      return
    }
    if (!isDeleted(node)) {
      this.showContextMenu(author)
    }
    const view = this.view
    const tr = view.state.tr
    tr.setSelection(NodeSelection.create(view.state.doc, pos))
    view.dispatch(tr)
  }

  private updateSelection = () => {
    const state = this.view.state
    const selection = selectedSuggestionKey.getState(state)?.suggestion
    this.container
      .querySelectorAll('.selected-suggestion')
      .forEach((e) => e.classList.remove('selected-suggestion'))
    if (selection) {
      const item = this.container.querySelector(
        `[data-track-id="${selection.id}"]`
      )
      item?.classList.add('selected-suggestion')
    }
  }

  public showContextMenu = (element: Element) => {
    this.props.popper.destroy() // destroy the old context menu

    const componentProps: ContextMenuProps = {
      actions: [
        {
          label: 'Edit',
          action: () => this.handleEdit(element.id),
          icon: 'Edit',
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
