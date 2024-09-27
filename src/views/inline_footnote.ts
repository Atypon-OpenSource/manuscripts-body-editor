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

import { ContextMenu, ContextMenuProps } from '@manuscripts/style-guide'
import {
  InlineFootnoteNode,
  ManuscriptNodeView,
  schema,
} from '@manuscripts/transform'
import { NodeSelection, TextSelection } from 'prosemirror-state'
import {
  ContentNodeWithPos,
  findChildrenByType,
  findParentNodeClosestToPos,
} from 'prosemirror-utils'

import {
  createFootnote,
  insertFootnote,
  insertTableFootnote,
} from '../commands'
import { FootnotesSelector } from '../components/views/FootnotesSelector'
import { buildTableFootnoteLabels, FootnoteWithIndex } from '../lib/footnotes'
import {
  getChangeClasses,
  isDeleted,
  isPendingInsert,
} from '../lib/track-changes-utils'
import { footnotesKey } from '../plugins/footnotes'
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

type ModalProps = Exclude<(typeof FootnotesSelector)['defaultProps'], undefined>

export class InlineFootnoteView
  extends BaseNodeView<Trackable<InlineFootnoteNode>>
  implements ManuscriptNodeView
{
  protected popperContainer: HTMLDivElement

  public isSelected() {
    const sel = this.view.state.selection
    const juxtaposed =
      sel.$head.pos === sel.$anchor.pos &&
      sel.$head.pos === this.getPos() + this.node.nodeSize
    if ((sel instanceof NodeSelection && sel.node == this.node) || juxtaposed) {
      return true
    }
    return false
  }

  public findParentTableElement = () =>
    findParentNodeClosestToPos(
      this.view.state.doc.resolve(this.getPos()),
      (node) => node.type === schema.nodes.table_element
    )

  public showContextMenu = () => {
    this.props.popper.destroy()
    const componentProps: ContextMenuProps = {
      actions: [
        {
          label: 'Edit',
          action: () => {
            this.props.popper.destroy()
            this.activateGenericFnModal()
          },
          icon: 'Edit',
        },
        // {
        //   label: 'Scroll to the footnote',
        //   action: () => {
        //     this.props.popper.destroy()
        //     this.scrollToReferenced()
        //   },
        //   icon: 'Icon TBD',
        // }
      ],
    }
    this.props.popper.show(
      this.dom,
      ReactSubView(
        this.props,
        ContextMenu,
        componentProps,
        this.node,
        this.getPos,
        this.view,
        'context-menu'
      ),
      'right-start',
      false
    )
  }

  public handleClick = () => {
    if (isDeleted(this.node)) {
      return
    }

    const tableElement = this.findParentTableElement()
    if (tableElement) {
      this.activateModal({
        notes: this.getNotes(tableElement),
        onAdd: this.onAdd,
      })
    } else {
      this.showContextMenu()
    }
  }

  scrollToReferenced = () => {
    if (this.node.attrs.rids?.length) {
      let nodePos: number | undefined = undefined
      this.view.state.doc.descendants((node, pos) => {
        if (node.attrs.id === this.node.attrs.rids[0]) {
          nodePos = pos
        }
      })
      if (nodePos && this.props.dispatch) {
        const sel = TextSelection.near(this.view.state.doc.resolve(nodePos + 1))
        this.props.dispatch(
          this.view.state.tr.setSelection(sel).scrollIntoView()
        )
      }
    }
  }

  activateModal(modalProps: Partial<ModalProps>) {
    const defaultModal: ModalProps = {
      notes: [],
      onInsert: this.onInsert,
      onCancel: this.destroy,
      inlineFootnote: this.node,
    }
    this.popperContainer = ReactSubView(
      { ...this.props, dispatch: this.view.dispatch },
      FootnotesSelector,
      {
        ...defaultModal,
        ...modalProps,
      },
      this.node,
      this.getPos,
      this.view,
      'footnote-editor'
    )
    this.props.popper.show(this.dom, this.popperContainer, 'auto', false)
  }

  activateGenericFnModal = () => {
    if (!this.props.getCapabilities().editArticle) {
      return
    }
    const fnState = footnotesKey.getState(this.view.state)
    if (fnState) {
      this.activateModal({
        notes: Array.from(fnState.unusedFootnotes.values()).reduce((acc, n) => {
          const node = n[0]
          if (!isDeleted(node)) {
            acc.push({
              node,
            })
          }

          return acc
        }, [] as Array<FootnoteWithIndex>),
        onCancel: () => {
          const { tr } = this.view.state
          if (this.node.attrs.rids.length) {
            this.view.dispatch(
              tr.delete(this.getPos(), this.getPos() + this.node.nodeSize)
            )
          }
          this.destroy()
        },
        onAdd: () => {
          const footnote = createFootnote(this.view.state, 'footnote')
          const tr = insertFootnote(
            this.view.state,
            this.view.state.tr,
            footnote
          )
          tr.setNodeAttribute(tr.mapping.map(this.getPos()), 'rids', [
            footnote.attrs.id,
          ])
          this.view.dispatch(tr)
          this.view.focus()
          this.destroy()
        },
        addNewLabel: 'Replace with new footnote',
      })
      return true
    }
    return false
  }

  public updateContents = () => {
    const attrs = this.node.attrs
    this.dom.setAttribute('rids', attrs.rids.join(','))
    this.dom.setAttribute('contents', attrs.contents)
    this.dom.className = [
      'footnote',
      ...getChangeClasses(this.node.attrs.dataTracked),
    ].join(' ')

    if (
      this.isSelected() &&
      (!attrs.rids || !attrs.rids.length) &&
      !this.findParentTableElement()
    ) {
      this.activateGenericFnModal()
    }
  }

  public initialise = () => {
    this.dom = this.createDOM()
    this.dom.classList.add('footnote')
    this.dom.addEventListener('click', this.handleClick)
    this.updateContents()
  }

  public ignoreMutation = () => true

  public createDOM = () => {
    return document.createElement('span')
  }

  public destroy = () => {
    this.props.popper.destroy()
    this.popperContainer?.remove()
  }

  public getNotes = (tableElement: ContentNodeWithPos) => {
    const footnotesElement = findChildrenByType(
      tableElement.node,
      schema.nodes.footnotes_element
    ).pop()?.node
    let footnotes: FootnoteWithIndex[] = []
    if (footnotesElement) {
      const tablesFootnoteLabels = buildTableFootnoteLabels(tableElement.node)
      footnotes = findChildrenByType(footnotesElement, schema.nodes.footnote)
        .filter(({ node }) => !isDeleted(node))
        .map(({ node }) => ({
          node: node,
          index: tablesFootnoteLabels.get(node.attrs.id),
        })) as FootnoteWithIndex[]
    }
    return footnotes
  }

  public onAdd = () => {
    const tableElement = this.findParentTableElement()
    if (tableElement) {
      insertTableFootnote(tableElement.node, tableElement.pos, this.view, {
        node: this.node,
        pos: this.getPos(),
      })
      this.destroy()
    }
  }

  public onInsert = (notes: FootnoteWithIndex[]) => {
    if (notes.length) {
      const contents = this.node.attrs.contents
        .split(',')
        .map((n) => parseInt(n))
      const rids = notes.map((note) => note.node.attrs.id)
      const { tr } = this.view.state

      if (rids.length) {
        this.view.dispatch(
          tr.setNodeMarkup(this.getPos(), undefined, {
            rids,
            contents: notes
              .map(({ index }) => (index ? index : Math.max(...contents) + 1))
              .join(),
          })
        )
      } else if (isPendingInsert(this.node)) {
        this.view.dispatch(
          tr.delete(this.getPos(), this.getPos() + this.node.nodeSize)
        )
      }
    }
    this.destroy()
  }
}

export default createNodeView(InlineFootnoteView)
