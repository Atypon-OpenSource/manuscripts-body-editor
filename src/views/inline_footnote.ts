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

import { FootnotesSelector, FootnoteWithIndex } from '@manuscripts/style-guide'
import {
  InlineFootnoteNode,
  ManuscriptNodeView,
  schema,
} from '@manuscripts/transform'
import { History } from 'history'
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
import {
  getChangeClasses,
  isDeleted,
  isRejectedInsert,
} from '../lib/track-changes-utils'
import { buildTableFootnoteLabels } from '../plugins/footnotes/footnotes-utils'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import ReactSubView from './ReactSubView'
import { footnotesKey } from '../plugins/footnotes'

export interface InlineFootnoteProps extends BaseNodeProps {
  history: History
}

type ModalProps = Exclude<(typeof FootnotesSelector)['defaultProps'], undefined>

export class InlineFootnoteView<
    PropsType extends InlineFootnoteProps & EditableBlockProps
  >
  extends BaseNodeView<PropsType>
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
    } else if (!this.activateGenericFnModal()) {
      if (this.node.attrs.rids?.length) {
        let nodePos: number | undefined = undefined
        this.view.state.doc.descendants((node, pos) => {
          if (node.attrs.id === this.node.attrs.rids[0]) {
            nodePos = pos
          }
        })
        if (nodePos && this.props.dispatch) {
          const sel = TextSelection.near(
            this.view.state.doc.resolve(nodePos + 1)
          )
          this.props.dispatch(
            this.view.state.tr.setSelection(sel).scrollIntoView()
          )
        }
      }
    }
  }

  activateModal(modalProps: Partial<ModalProps>) {
    const defaultModal: ModalProps = {
      notes: [],
      onInsert: this.onInsert,
      onCancel: this.destroy,
      inlineFootnote: this.node as InlineFootnoteNode,
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
    this.props.popper.show(this.dom, this.popperContainer, 'auto', false, {
      preventOverflow: {
        boundariesElement: 'viewport', // You can also use 'window'
      },
      flip: {
        behavior: 'clockwise', // Options: 'flip', 'clockwise', 'counterclockwise'
      },
    })
  }

  activateGenericFnModal() {
    const fnState = footnotesKey.getState(this.view.state)
    if (
      (!this.node.attrs.rids || !this.node.attrs.rids.length) &&
      fnState &&
      fnState.unusedFootnotes.size > 0
    ) {
      this.activateModal({
        notes: Array.from(fnState.unusedFootnotes.values()).map((n) => ({
          node: n[0],
        })),
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

  maybeActivateModal() {
    if (this.isSelected()) {
      this.activateGenericFnModal()
    }
  }

  public updateContents = () => {
    const node = this.node as InlineFootnoteNode
    this.dom.setAttribute('rids', node.attrs.rids.join(','))
    this.dom.setAttribute('contents', node.attrs.contents)
    this.dom.className = [
      'footnote',
      ...getChangeClasses(this.node.attrs.dataTracked),
    ].join(' ')

    this.maybeActivateModal()
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
        .filter(({ node }) => !isDeleted(node) && !isRejectedInsert(node))
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
        node: this.node as InlineFootnoteNode,
        pos: this.getPos(),
      })
      this.destroy()
    }
  }

  public onInsert = (notes: FootnoteWithIndex[]) => {
    const contents = this.node.attrs.contents.split(',')
    const rids = notes.map((note) => note.node.attrs.id)
    const { tr } = this.view.state
    this.view.dispatch(
      rids.length
        ? tr.setNodeMarkup(this.getPos(), undefined, {
            rids,
            contents: notes
              .map(({ index }) => (index ? index : Math.max(...contents) + 1))
              .join(),
          })
        : tr.delete(this.getPos(), this.getPos() + this.node.nodeSize)
    )
    this.destroy()
  }
}

export default createNodeView(InlineFootnoteView)
