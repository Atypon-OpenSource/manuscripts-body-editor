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

import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  FootnoteNode,
  FootnotesElementNode,
  InlineFootnoteNode,
  isFootnoteNode,
  isFootnotesElementNode,
  isFootnotesSectionNode,
  isInlineFootnoteNode,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { isEqual } from 'lodash'
import {
  NodeSelection,
  Plugin,
  PluginKey,
  TextSelection,
} from 'prosemirror-state'
import {
  findParentNodeClosestToPos,
  findParentNodeOfType,
  NodeWithPos,
} from 'prosemirror-utils'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

import { alertIcon, deleteIcon } from '../../assets'
import { isTextSelection } from '../../commands'
import {
  DeleteFootnoteDialog,
  DeleteFootnoteDialogProps,
} from '../../components/views/DeleteFootnoteDialog'
import { EditorProps } from '../../configs/ManuscriptsEditor'
import { getChildOfType } from '../../lib/utils'
import ReactSubView from '../../views/ReactSubView'
import { placeholderWidget } from '../placeholder'
import {
  findTableInlineFootnoteIds,
  getAlphaOrderIndices,
  getInlineFootnotes,
} from './footnotes-utils'

export interface PluginState {
  inlineFootnotes: [InlineFootnoteNode, number][]
  unusedFootnotes: Map<string, [FootnoteNode, number]>
  footnotes: Map<string, [FootnoteNode, number]>
  footnoteElement?: [FootnotesElementNode, number]
  labels: Map<string, string>
}

export const footnotesKey = new PluginKey<PluginState>('footnotes')

const scrollToInlineFootnote = (rid: string, view: EditorView) => {
  view.state.doc.descendants((node, pos) => {
    const footnote = node as InlineFootnoteNode
    if (isInlineFootnoteNode(node) && footnote.attrs.rids.includes(rid)) {
      const selection = NodeSelection.create(view.state.doc, pos)
      view.dispatch(view.state.tr.setSelection(selection).scrollIntoView())
    }
  })
}

const labelWidget =
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
  element.innerHTML = alertIcon
  return element
}

const deleteFootnoteWidget =
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
    deleteBtn.innerHTML = deleteIcon

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
          const footnotesElement = findParentNodeClosestToPos(
            tr.doc.resolve(pos),
            (node) => node.type === schema.nodes.footnotes_element
          )

          // remove table-element-footer if it has only one footnote
          if (
            footnotesElement?.node.childCount === 1 &&
            tableElementFooter?.node.childCount === 1
          ) {
            const { pos: fnPos, node: fnNode } = tableElementFooter
            tr.delete(fnPos, fnPos + fnNode.nodeSize + 1)
          } else if (footnotesElement?.node.childCount === 1) {
            const { pos: fnPos, node: fnNode } = footnotesElement
            tr.delete(fnPos, fnPos + fnNode.nodeSize + 1)
          } else {
            const footnote = findParentNodeClosestToPos(
              tr.doc.resolve(pos),
              (node) => node.type === schema.nodes.footnote
            )
            if (footnote) {
              const { pos: fnPos, node: fnNode } = footnote
              tr.delete(fnPos, fnPos + fnNode.nodeSize + 1)
            }
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

/**
 * This plugin provides support of footnotes related behaviours:
 *  - It adds and updates superscripted numbering of the footnotes on editor state changes
 *  - deletes inline footnotes when a footnotes is deleted
 *  - provides an ability to scroll to a footnote upon clicking on the respective inline footnotes
 */

export const buildPluginState = (doc: ManuscriptNode): PluginState => {
  const inlineFootnotes: [InlineFootnoteNode, number][] = []
  const footnotes: Map<string, [FootnoteNode, number]> = new Map()
  let footnoteElement: [FootnotesElementNode, number] | undefined

  doc.descendants((node, pos, parentNode) => {
    if (isFootnotesSectionNode(node)) {
      // this has to be done because footnote element is used in tables too
      node.descendants((node, childPos) => {
        if (isFootnotesElementNode(node)) {
          footnoteElement = [node, pos + childPos]
        }

        if (isFootnoteNode(node)) {
          footnotes.set(node.attrs.id, [node, pos + childPos])
        }
      })
    }

    if (
      isInlineFootnoteNode(node) &&
      parentNode &&
      parentNode.type !== schema.nodes.table_cell &&
      parentNode.type !== schema.nodes.table_header
    ) {
      inlineFootnotes.push([node, pos])
    }
  })

  let index = 0
  const labels = new Map<string, string>()

  inlineFootnotes.sort((a, b) => a[1] - b[1])
  inlineFootnotes.forEach(([node]) => {
    node.attrs.rids.forEach((rid) => {
      labels.set(rid, getAlphaOrderIndices(index++))
    })
  })

  const footnotesReordered: FootnoteNode[] = []
  const footnotesRest = new Map(footnotes)

  inlineFootnotes.forEach(([node]) => {
    const footnote = node as InlineFootnoteNode
    footnote.attrs.rids.forEach((rid) => {
      const currentfNode = footnotesRest.get(rid)
      if (currentfNode) {
        footnotesReordered.push(currentfNode[0])
        footnotesRest.delete(rid)
      }
    })
  })

  return {
    inlineFootnotes,
    unusedFootnotes: footnotesRest,
    footnotes,
    footnoteElement,
    labels,
  }
}

export default (props: EditorProps) => {
  return new Plugin<PluginState>({
    key: footnotesKey,

    state: {
      init(config, instance): PluginState {
        return buildPluginState(instance.doc)
      },

      apply(tr, value, oldState, newState): PluginState {
        const prevState = footnotesKey.getState(oldState)
        if (!tr.docChanged && prevState) {
          return prevState
        }
        return buildPluginState(newState.doc)
      },
    },

    appendTransaction(transactions, oldState, newState) {
      const { inlineFootnotes: oldInlineFootnoteNodes } = footnotesKey.getState(
        oldState
      ) as PluginState

      const {
        inlineFootnotes: inlineFootnoteNodes,
        footnotes,
        labels,
        footnoteElement,
        unusedFootnotes,
      } = footnotesKey.getState(newState) as PluginState

      const prevIds = oldInlineFootnoteNodes.map(([node]) => node.attrs.rids)
      const newIds = inlineFootnoteNodes.map(([node]) => node.attrs.rids)
      const initTransaction = transactions.find((t) => t.getMeta('INIT'))

      if (!footnoteElement || (!initTransaction && isEqual(prevIds, newIds))) {
        return null
      }

      const { tr } = newState

      const footnotesReordered: FootnoteNode[] = []

      inlineFootnoteNodes.forEach(([node, pos]) => {
        const footnote = node as InlineFootnoteNode
        const contents = footnote.attrs.rids
          .map((rid) => {
            const currentfNode = footnotes.get(rid)
            if (currentfNode) {
              footnotesReordered.push(currentfNode[0])
            }
            return labels.get(rid)
          })
          .join('')

        // displaying indices
        if (footnote.attrs.contents !== contents) {
          tr.setNodeMarkup(pos, undefined, {
            ...footnote.attrs,
            rids: footnote.attrs.rids,
            contents,
          })
        }
      })

      // unused footnotes go to the bottom of the list
      unusedFootnotes.forEach(([node]) => footnotesReordered.push(node))

      // replacing footnotes in footnote element
      const newFElement = schema.nodes.footnotes_element.create(
        footnoteElement[0].attrs,
        footnotesReordered
      )

      if (newFElement && footnotes.size > 0) {
        tr.replaceWith(
          footnoteElement[1],
          footnoteElement[1] + footnoteElement[0].nodeSize,
          newFElement
        )
      }

      const prevSelection = newState.selection
      const selectedFootnote = findParentNodeClosestToPos(
        prevSelection.$anchor,
        (node) => isFootnoteNode(node)
      )
      // relocating selection to the new position of the selected footnotes (selection set in commands normally)
      if (selectedFootnote && footnotes.size > 0) {
        let newFootnotePos = 0

        for (let i = 0; i < footnotesReordered.length; i++) {
          const node = footnotesReordered[i]
          // has to run after persist plugin
          newFootnotePos += node.nodeSize
          if (node.attrs.id === selectedFootnote.node.attrs.id) {
            break
          }
        }
        // selection will be lost otherwise as we replace the element completely
        tr.setSelection(
          TextSelection.create(tr.doc, footnoteElement[1] + newFootnotePos)
        )
      }

      skipTracking(tr)
      return tr
    },

    props: {
      decorations: (state) => {
        const decorations: Decoration[] = []

        const generalFootnote = findParentNodeOfType(
          schema.nodes.general_table_footnote
        )(state.selection)

        const tableElement = findParentNodeOfType(schema.nodes.table_element)(
          state.selection
        )

        const tableElementFooter = findParentNodeOfType(
          schema.nodes.table_element_footer
        )(state.selection)

        const footnote = findParentNodeOfType(schema.nodes.footnote)(
          state.selection
        )
        let targetNode
        if (footnote) {
          targetNode = footnote
        } else if (generalFootnote) {
          targetNode = generalFootnote
        }
        const can = props.getCapabilities()
        if (targetNode && can.editArticle && isTextSelection(state.selection)) {
          decorations.push(
            // Add a class for styling selected table element footnotes
            Decoration.node(
              targetNode.pos,
              targetNode.pos + targetNode.node.nodeSize,
              {
                class: 'footnote-selected',
              }
            )
          )
          decorations.push(
            Decoration.widget(
              targetNode.pos + 1,

              deleteFootnoteWidget(
                targetNode.node,
                props,
                targetNode.node.attrs.id,
                tableElement,
                tableElementFooter
              ),
              {
                key: targetNode.node.attrs.id,
              }
            )
          )
        }
        const { labels } = footnotesKey.getState(state) as PluginState
        let tableInlineFootnoteIds: Set<string> | undefined = undefined
        state.doc.descendants((node, pos, parent) => {
          if (isFootnoteNode(node)) {
            const id = node.attrs.id
            if (!labels || !labels.has(id)) {
              decorations.push(
                Decoration.widget(pos + 2, uncitedFootnoteWidget(), {
                  side: -1,
                })
              )
            }
            else {
              const label = labels.get(id)
              if (label) {
                decorations.push(
                  Decoration.widget(pos + 2, labelWidget(label, id), {
                    side: -1,
                  })
                )
              }
            }
            if (!node.firstChild?.textContent) {
              decorations.push(
                Decoration.widget(
                  pos + 2,
                  placeholderWidget('Type new footnote here')
                )
              )
            }

            if (
              tableInlineFootnoteIds &&
              !tableInlineFootnoteIds.has(node.attrs.id)
            ) {
              decorations.push(
                Decoration.widget(
                  pos + node.nodeSize - 1,
                  uncitedFootnoteWidget()
                )
              )
            }
          }

          if (node.type === schema.nodes.footnotes_element) {
            if (parent?.type === schema.nodes.table_element_footer) {
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: 'table-footnotes-element',
                })
              )
              tableInlineFootnoteIds = findTableInlineFootnoteIds(
                state.doc.resolve(pos)
              )
            } else {
              tableInlineFootnoteIds = undefined
            }
          }
        })

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
}
