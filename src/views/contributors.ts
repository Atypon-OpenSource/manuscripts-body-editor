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
import { ContributorNode, isContributorNode } from '@manuscripts/transform'

import { affiliationsKey } from '../plugins/affiliations'
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

export class Contributors<
  PropsType extends ContributorsProps
> extends BlockView<PropsType> {
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
    const authors: ContributorNode[] = []
    const authorsWrapper = document.createElement('div')
    authorsWrapper.classList.add('contributors-list')

    this.node.content?.forEach((node) => {
      if (isContributorNode(node)) {
        authors.push(node)
      }
    })

    authors
      .sort((a, b) => Number(a.attrs.priority) - Number(b.attrs.priority))
      .forEach((author, i) => {
        const jointAuthors = this.isJointFirstAuthor(authors, i)
        authorsWrapper.appendChild(this.buildAuthor(author, jointAuthors))
      })
    this.container.appendChild(authorsWrapper)
  }

  container: HTMLElement
  inner: HTMLElement

  buildAuthor = (node: ContributorNode, isJointFirstAuthor: boolean) => {
    const pluginState = affiliationsKey.getState(this.view.state)
    const attrs = node.attrs as TrackableAttributes<ContributorNode>

    const container = document.createElement('button')
    container.classList.add('contributor')
    container.setAttribute('id', attrs.id)
    container.setAttribute('contenteditable', 'false')

    if (attrs.dataTracked?.length) {
      container.setAttribute('data-track-status', attrs.dataTracked[0].status)
      container.setAttribute('data-track-op', attrs.dataTracked[0].operation)
    } else {
      container.removeAttribute('data-track-status')
      container.removeAttribute('data-track-type')
    }

    const can = this.props.getCapabilities()

    const disableEditButton = !can.editMetadata

    const { bibliographicName, isCorresponding, email, id } = attrs

    container.addEventListener('click', (e) => {
      e.preventDefault()
      if (!disableEditButton) {
        this.props.openAuthorEditing()
        this.props.selectAuthorForEditing(id)
      }
    })

    const name = this.buildNameLiteral(bibliographicName)
    container.innerHTML = isCorresponding && email ? `${name} (${email})` : name

    let noteText = ''
    if (pluginState?.indexedAffiliationIds) {
      attrs.affiliations.map((af) => {
        const index = pluginState?.indexedAffiliationIds.get(af)
        if (index) {
          noteText += index.toString()
        }
      })
    }

    if (isJointFirstAuthor) {
      container.appendChild(this.createNote('†', 'Joint contributor'))
    }

    if (noteText) {
      container.appendChild(this.createNote(noteText))
    }

    if (attrs.isCorresponding) {
      container.appendChild(this.createNote('*', 'Corresponding author'))
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
    // this.props.openAuthorEditing
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

  public ignoreMutation = () => true

  public stopEvent = () => true
}

export default createNodeView(Contributors)
