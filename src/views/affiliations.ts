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

import { ContextMenu, ContextMenuProps } from '@manuscripts/style-guide'
import {
  addTrackChangesAttributes,
  isDeleted,
} from '@manuscripts/track-changes-plugin'
import { AffiliationNode, schema } from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'

import {
  AuthorsAndAffiliationsModals,
  AuthorsAndAffiliationsModalsProps,
} from '../components/authors-affiliations/AuthorsAndAffiliationsModals'
import { alertIcon } from '../icons'
import {
  AffiliationAttrs,
  affiliationName,
} from '../lib/authors'
import { handleComment } from '../lib/comments'

import { findChildByID, findChildrenAttrsByType } from '../lib/view'
import { affiliationsKey, PluginState } from '../plugins/affiliations'
import { HIGHLIGHT_SELECTOR, selectedSuggestionKey } from '../plugins/selected-suggestion'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

//todo update AffiliationNode to AffiliationsNode
export class AffiliationsView extends BlockView<Trackable<AffiliationNode>> {
  contextMenu: HTMLElement
  version: string
  container: HTMLElement
  popper?: HTMLElement

  public ignoreMutation = () => true
  public stopEvent = () => true

  public createElement() {
    this.container = document.createElement('div')
    this.container.classList.add('affiliations', 'block')
    this.container.contentEditable = 'false'
    this.container.addEventListener('click', this.handleClick)
    this.dom.setAttribute('contenteditable', 'false')
    this.dom.appendChild(this.container)
  }

  public updateContents() {
    super.updateContents()
    const affs = affiliationsKey.getState(this.view.state)

    if (!affs) {
      return
    }
    if (this.version === affs.version) {
      this.updateSelection()
      return
    }
    this.version = affs.version
    this.container.innerHTML = ''
    this.buildAffiliations(affs)
    this.updateSelection()
  }

  private buildAffiliations(affs: PluginState) {
    const elements = []
    for (const affiliation of affs.affiliations) {
      const index = affs.indexedAffiliationIds.get(affiliation.id)
      elements.push({
        index,
        element: this.buildAffiliation(affiliation, index),
      })
    }

    elements
      .sort(this.sortAffiliations)
      .forEach((e) => this.container.appendChild(e.element))
  }

  private buildAffiliation(attrs: AffiliationAttrs, index?: number) {
    const element = document.createElement('div')
    element.classList.add('affiliation')
    element.id = attrs.id
    addTrackChangesAttributes(attrs, element)

    const marker = document.createElement('span')
    if (index) {
      marker.classList.add('affiliation-label')
      marker.innerText = String(index)
    } else {
      marker.innerHTML = alertIcon
    }
    element.appendChild(marker)

    const name = document.createElement('span')
    name.classList.add('affiliation-name')
    name.innerHTML = affiliationName(attrs)
    element.appendChild(name)
    return element
  }

  private sortAffiliations(aff1: { index?: number }, aff2: { index?: number }) {
    const index1 = aff1.index || 10000
    const index2 = aff2.index || 10000
    return index1 - index2
  }

  private handleClick = (event: Event) => {
    const element = event.target as HTMLElement
    const affiliation = element.closest('.affiliation')
    if (!affiliation) {
      return
    }
    const { node, pos } = findChildByID(this.view, affiliation.id) || {}
    if (!node || !pos) {
      return
    }
    if (!isDeleted(node)) {
      this.showContextMenu(affiliation)
    }

    const view = this.view
    const tr = view.state.tr
    tr.setSelection(NodeSelection.create(view.state.doc, pos))
    view.dispatch(tr)
  }

  private updateSelection() {
    const state = this.view.state
    const selection = selectedSuggestionKey.getState(state)?.suggestion
    const highlightedAuthorId = selectedSuggestionKey.getState(state)?.highlightedAuthorId

    this.container.querySelectorAll('.affiliation').forEach(e => {
      const item = e as HTMLElement      
      item.classList.remove('selected-suggestion')
      if (selection && item.dataset.trackId === selection.id) {
        item.classList.add('selected-suggestion')
      }
      if (highlightedAuthorId && item.dataset.trackAuthor === highlightedAuthorId) {
        item.classList.add(HIGHLIGHT_SELECTOR)
      } else {
        item.classList.remove(HIGHLIGHT_SELECTOR)
      }
    })
  }

  handleEdit = (id: string, addNew?: boolean) => {
    this.props.popper.destroy()

    const affiliations = findChildrenAttrsByType<AffiliationAttrs>(
      this.view,
      schema.nodes.affiliation
    )
    const affiliation = id ? affiliations.find((a) => a.id === id) : undefined
    const componentProps: AuthorsAndAffiliationsModalsProps = {
      initialModal: 'affiliations',
      view: this.view,
      affiliation,
      addNewAffiliation: addNew,
    }

    this.popper?.remove()

    this.popper = ReactSubView(
      this.props,
      AuthorsAndAffiliationsModals,
      componentProps,
      this.node,
      this.getPos,
      this.view
    )
    this.container.appendChild(this.popper)
  }

  public showGroupContextMenu = (): HTMLElement | undefined => {
    const can = this.props.getCapabilities()
    const componentProps: ContextMenuProps = {
      actions: [],
    }

    if (can.editArticle) {
      componentProps.actions.push({
        label: 'Comment',
        action: () => handleComment(this.node, this.view),
        icon: 'AddComment',
      })
      componentProps.actions.push({
        label: 'New Affiliation',
        action: () => this.handleEdit('', true),
        icon: 'AddOutline',
      })
      componentProps.actions.push({
        label: 'Edit',
        action: () => this.handleEdit(''),
        icon: 'Edit',
      })

      this.contextMenu = ReactSubView(
        this.props,
        ContextMenu,
        componentProps,
        this.node,
        this.getPos,
        this.view,
        ['context-menu']
      )
      return this.contextMenu
    }

    return undefined
  }

  public showContextMenu = (element: Element) => {
    const affiliationNameBlock = element.querySelector('.affiliation-name')
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
      ['context-menu']
    )
    this.props.popper.show(
      affiliationNameBlock || element,
      this.contextMenu,
      'right-start'
    )
  }

  public actionGutterButtons = (): HTMLElement[] => {
    const contextMenu = this.showGroupContextMenu()
    return contextMenu ? [contextMenu] : []
  }
}

export default createNodeView(AffiliationsView)
