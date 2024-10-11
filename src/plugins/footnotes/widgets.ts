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

import { AlertIcon, DeleteIcon } from '@manuscripts/style-guide'
import {
  InlineFootnoteNode,
  isInlineFootnoteNode,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'
import { findParentNodeClosestToPos, NodeWithPos } from 'prosemirror-utils'
import { EditorView } from 'prosemirror-view'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  DeleteFootnoteDialog,
  DeleteFootnoteDialogProps,
} from '../../components/views/DeleteFootnoteDialog'
import { EditorProps } from '../../configs/ManuscriptsEditor'
import { getInlineFootnotes } from '../../lib/footnotes'
import { isDeleted } from '../../lib/track-changes-utils'
import { getChildOfType } from '../../lib/utils'
import ReactSubView from '../../views/ReactSubView'

export const deleteFootnoteWidget =
  (
    node: ManuscriptNode,
    props: EditorProps,
    id: string,
    tableElement: NodeWithPos | undefined,
    tableElementFooter: NodeWithPos | undefined
  ) =>
  (view: EditorView, getPos: () => number | undefined) => {
    const deleteBtn = document.createElement('span')
    deleteBtn.className = 'delete-icon'
    deleteBtn.innerHTML = renderToStaticMarkup(createElement(DeleteIcon))

    const parentType = tableElement ? 'table ' : ''
    const footnote = {
      type:
        node.type === schema.nodes.footnote
          ? `${parentType}footnote`
          : 'table general note',
      message:
        node.type === schema.nodes.footnote
          ? `This action will entirely remove the ${parentType}footnote from the list because it will no longer be used.`
          : 'This action will entirely remove the table general note.',
    }

    deleteBtn.addEventListener('mousedown', () => {
      const handleDelete = () => {
        const tr = view.state.tr
        const pos = getPos()

        // delete general footnotes
        if (node.type === schema.nodes.general_table_footnote && pos) {
          if (
            tableElementFooter &&
            !getChildOfType(
              tableElementFooter.node,
              schema.nodes.footnotes_element,
              true
            ) &&
            tableElementFooter.pos
          ) {
            // All child nodes are general footnotes
            tr.delete(
              tableElementFooter.pos - 1,
              tableElementFooter.pos + tableElementFooter.node.nodeSize
            )
          } else {
            tr.delete(pos - 1, pos + node.nodeSize + 1)
          }
        }

        // delete footnote
        if (node.type === schema.nodes.footnote && pos) {
          const targetNode = tableElement ? tableElement.node : view.state.doc
          const inlineFootnotes = getInlineFootnotes(id, targetNode)

          // remove table-element-footer if it has only one footnote
          const footnote = findParentNodeClosestToPos(
            tr.doc.resolve(pos),
            (node) => node.type === schema.nodes.footnote
          )
          if (footnote) {
            const { pos: fnPos, node: fnNode } = footnote
            tr.delete(fnPos, fnPos + fnNode.nodeSize + 1)
          }

          // delete inline footnotes
          if (inlineFootnotes) {
            inlineFootnotes.forEach((footnote) => {
              const pos =
                footnote.pos + (tableElement ? tableElement.pos + 1 : 0)
              if (footnote.node.attrs.rids.length > 1) {
                const updatedRids = footnote.node.attrs.rids.filter(
                  (rid) => rid !== id
                )
                tr.setNodeMarkup(tr.mapping.map(pos), undefined, {
                  ...node.attrs,
                  rids: updatedRids,
                })
              } else {
                tr.delete(
                  tr.mapping.map(pos),
                  tr.mapping.map(pos + footnote.node.nodeSize)
                )
              }
            })
          }
        }

        view.dispatch(tr)

        // Check if all footnotes within `footnotesElement` have been deleted and remove the footnotesElement if true

        if (pos) {
          const footnotesElement = findParentNodeClosestToPos(
            view.state.doc.resolve(pos),
            (node) => node.type === schema.nodes.footnotes_element
          )

          if (footnotesElement) {
            let allFootnotesDeleted = true

            // Check if all footnote in footnotesElement are deleted
            footnotesElement.node.descendants((child) => {
              if (child.type === schema.nodes.footnote && !isDeleted(child)) {
                allFootnotesDeleted = false
                return false
              }
            })
            if (allFootnotesDeleted) {
              const { pos: fnPos, node: fnNode } = footnotesElement
              const tr2 = view.state.tr
              tr2.delete(fnPos, fnPos + fnNode.nodeSize + 1)
              view.dispatch(tr2)
            }
          }
        }
      }

      const componentProps: DeleteFootnoteDialogProps = {
        footnoteType: footnote.type,
        footnoteMessage: footnote.message,
        handleDelete: handleDelete,
      }

      ReactSubView(
        { ...props, dispatch: view.dispatch } as unknown as EditorProps,
        DeleteFootnoteDialog,
        componentProps,
        node,
        () => getPos() as number,
        view
      )
    })

    return deleteBtn
  }

const scrollToInlineFootnote = (rid: string, view: EditorView) => {
  view.state.doc.descendants((node, pos) => {
    const footnote = node as InlineFootnoteNode
    if (isInlineFootnoteNode(node) && footnote.attrs.rids.includes(rid)) {
      const selection = NodeSelection.create(view.state.doc, pos)
      view.dispatch(view.state.tr.setSelection(selection).scrollIntoView())
    }
  })
}

export const labelWidget =
  (label: string, id: string) =>
  (view: EditorView): Element => {
    const element = document.createElement('span')
    element.className = 'footnote-label'
    element.textContent = label

    element.addEventListener('mousedown', () => {
      scrollToInlineFootnote(id, view)
    })
    return element
  }

export const uncitedFootnoteWidget = () => () => {
  const element = document.createElement('span')
  element.className = 'uncited-footnote'
  element.innerHTML = renderToStaticMarkup(createElement(AlertIcon))
  return element
}
