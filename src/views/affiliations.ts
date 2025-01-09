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
import { AffiliationNode } from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'

import { AffiliationAttrs, affiliationName } from '../lib/authors'
import {
  createCommentMarker,
  handleComment,
  handleCommentMarkerClick,
  updateCommentSelection,
} from '../lib/comments'
import { addTrackChangesAttributes } from '../lib/track-changes-utils'
import { findChildByID } from '../lib/view'
import { affiliationsKey, PluginState } from '../plugins/affiliations'
import { selectedSuggestionKey } from '../plugins/selected-suggestion'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

//todo update AffiliationNode to AffiliationsNode
export class AffiliationsView extends BlockView<Trackable<AffiliationNode>> {
  version: string
  container: HTMLElement
  contextMenu: HTMLElement

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

    const comment = createCommentMarker('div', this.node.attrs.id)
    this.container.prepend(comment)

    this.buildAffiliations(affs)
    this.updateSelection()
  }

  public affiliationsContextMenu = () => {
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
    return this.contextMenu
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

    if (index) {
      const label = document.createElement('span')
      label.classList.add('affiliation-label')
      label.innerHTML = String(index)
      element.appendChild(label)
    }

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

  private handleClick(event: Event) {
    const element = event.target as HTMLElement
    const item = element.closest('.affiliation')

    if (item) {
      const node = findChildByID(this.view, item.id)
      if (!node) {
        return
      }
      const view = this.view
      const tr = view.state.tr
      tr.setSelection(NodeSelection.create(view.state.doc, node.pos))
      view.dispatch(tr)
    }
  }

  private updateSelection() {
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

    const marker = this.container.querySelector(
      '.comment-marker'
    ) as HTMLElement

    marker.addEventListener('click', (event: Event) => {
      handleCommentMarkerClick(event, this.view)
    })
    updateCommentSelection(marker, this.view)
  }
  public actionGutterButtons = (): HTMLElement[] => [
    this.affiliationsContextMenu(),
  ]
}

export default createNodeView(AffiliationsView)
