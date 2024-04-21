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

import {
  InlineFootnoteNode,
  isFootnoteNode,
  isInlineFootnoteNode,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { isEqual } from 'lodash'
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state'
import {
  findParentNodeClosestToPos,
  findParentNodeOfType,
  hasParentNodeOfType,
  NodeWithPos,
} from 'prosemirror-utils'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

import { alertIcon, deleteIcon } from '../../assets'
import {
  DeleteFootnoteDialog,
  DeleteFootnoteDialogProps,
} from '../../components/views/DeleteFootnoteDialog'
import { PluginProps } from '../../configs/editor-plugins'
import { EditorProps } from '../../configs/ManuscriptsEditor'
import { findParentNodeWithIdValue } from '../../lib/utils'
import ReactSubView from '../../views/ReactSubView'
import { placeholderWidget } from '../placeholder'
import { findTableInlineFootnoteIds } from './footnotes-utils'

interface PluginState {
  nodes: [InlineFootnoteNode, number][]
  labels: Map<string, string>
}

export const footnotesKey = new PluginKey<PluginState>('footnotes')

export const buildPluginState = (doc: ManuscriptNode): PluginState => {
  const nodes: [InlineFootnoteNode, number][] = []

  let index = 0
  const labels = new Map<string, string>()

  doc.descendants((node, pos, parentNode) => {
    if (
      isInlineFootnoteNode(node) &&
      parentNode &&
      parentNode.type !== schema.nodes.table_cell
    ) {
      nodes.push([node, pos])
      node.attrs.rids.forEach((rid) => {
        labels.set(rid, String(++index))
      })
    }
  })

  return { nodes, labels }
}

const scrollToInlineFootnote = (rid: string, view: EditorView) => {
  view.state.doc.descendants((node, pos) => {
    const footnote = node as InlineFootnoteNode
    if (footnote.attrs.rids.includes(rid)) {
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

    element.addEventListener('click', () => {
      scrollToInlineFootnote(id, view)
    })

    return element
  }

export const uncitedFootnoteWidget = () => () => {
  const element = document.createElement('span')
  element.className = 'unctied-table-footnote'
  element.innerHTML = alertIcon
  return element
}
interface InlineFootnote {
  node: InlineFootnoteNode
  pos: number
}

export const getInlineFootnotes = (
  view: EditorView,
  id: string,
  tableElement: NodeWithPos
): InlineFootnote[] => {
  const inlineFootnotes: InlineFootnote[] = []

  tableElement.node.content.descendants((node, pos) => {
    if (node.type === schema.nodes.inline_footnote) {
      const footnote = node as InlineFootnoteNode
      if (footnote.attrs.rids?.includes(id)) {
        inlineFootnotes.push({ node: footnote, pos })
      }
    }
  })
  console.log(inlineFootnotes)
  return inlineFootnotes
}

const deleteFootnoteWidget =
  (
    node: ManuscriptNode,
    props: PluginProps,
    footnoteType: string,
    footnoteMessage: string,
    id: string,
    tableElement: NodeWithPos
  ) =>
  (view: EditorView, getPos: () => number | undefined) => {
    const deleteBtn = document.createElement('span')
    deleteBtn.className = 'delete-icon'
    deleteBtn.innerHTML = deleteIcon

    deleteBtn.addEventListener('click', () => {
      const handleDelete = () => {
        let tr = view.state.tr
        const pos = getPos()

        // delete table footnotes
        if (node.type === schema.nodes.footnote && pos) {
          const inlineFootnotes = getInlineFootnotes(view, id, tableElement)

          const nodeWithPos = findParentNodeClosestToPos(
            tr.doc.resolve(pos),
            (node) => node.type === schema.nodes.footnote
          )
          if (nodeWithPos) {
            const { pos: fnPos, node: fnNode } = nodeWithPos
            view.dispatch(tr.delete(fnPos, fnPos + fnNode.nodeSize))
          }

          // delete inline footnotes
          if (inlineFootnotes) {
            tr = view.state.tr

            inlineFootnotes.forEach((footnote) => {
              tr.delete(
                footnote.pos + tableElement.pos + 1,
                footnote.pos + tableElement.pos + footnote.node.nodeSize + 1
              )
            })
            view.dispatch(tr)
          }
        }
      }

      const componentProps: DeleteFootnoteDialogProps = {
        footnoteType: footnoteType,
        footnoteMessage: footnoteMessage,
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
 * TODO:
 *   1. use setMeta to notify of updates when the doc hasn't changed in appendTransaction
 *     if (!transactions.some(transaction => transaction.docChanged)) {
 *       return null
 *     }
 *   2. re-order footnotes as inline_footnotes are re-ordered? - may cause syncing issues
 *
 * NOTE:
 *   1. The footnotes deletions isn't prevented on purpose as it may cause a syncing issues.
 *      This, however, maybe required in the future. It maybe done with something like that:
 *       filterTransaction(transaction, state) {
 *         const pluginState = footnotesKey.getState(state)
 *         if (pluginState) {
 *           const presentFootnotesIds = []
 *           transaction.doc.descendants((node, pos) => {
 *             if (isFootnoteNode(node)) {
 *               presentFootnotesIds.push(node.attrs.id)
 *             }
 *           })
 *           if (presentFootnotesIds.length < pluginState.nodes.length) {
 *             return false
 *           }
 *         }
 *         return true
 *       },
 *
 */

export default (props: PluginProps) => {
  return new Plugin<PluginState>({
    key: footnotesKey,

    state: {
      init(config, instance): PluginState {
        return buildPluginState(instance.doc)
      },

      apply(tr, value, oldState, newState): PluginState {
        return buildPluginState(newState.doc)
      },
    },

    appendTransaction(transactions, oldState, newState) {
      const { nodes: oldInlineFootnoteNodes } = footnotesKey.getState(
        oldState
      ) as PluginState

      const { nodes: inlineFootnoteNodes, labels } = footnotesKey.getState(
        newState
      ) as PluginState

      if (isEqual(inlineFootnoteNodes, oldInlineFootnoteNodes)) {
        return null
      }

      const { tr } = newState

      inlineFootnoteNodes.forEach(([node, pos]) => {
        const footnote = node as InlineFootnoteNode
        const contents = footnote.attrs.rids
          .map((rid) => labels.get(rid))
          .join('')

        if (footnote.attrs.contents !== contents) {
          tr.setNodeMarkup(pos, undefined, {
            ...footnote.attrs,
            rids: footnote.attrs.rids,
            contents,
          })
        }
      })

      return tr
    },

    props: {
      decorations: (state) => {
        const decorations: Decoration[] = []

        const isInTableElementFooter = hasParentNodeOfType(
          schema.nodes.table_element_footer
        )(state.selection)

        const tableElement = findParentNodeOfType(schema.nodes.table_element)(
          state.selection
        )

        if (isInTableElementFooter) {
          const parent = findParentNodeWithIdValue(state.selection)
          if (parent) {
            decorations.push(
              // Add a class for styling selected table element footnotes
              Decoration.node(parent.pos, parent.pos + parent.node.nodeSize, {
                class: 'footnote-selected',
              })
            )
          }
        }

        const { labels } = footnotesKey.getState(state) as PluginState
        let tableInlineFootnoteIds: Set<string> | undefined = undefined
        const can = props.getCapabilities()

        state.doc.descendants((node, pos, parent) => {
          if (isFootnoteNode(node)) {
            const id = node.attrs.id
            if (labels) {
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
                  placeholderWidget('Add new note here')
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
          if (can.editArticle) {
            if (tableElement) {
              const footnote = (() => {
                switch (node.type) {
                  case schema.nodes.footnote:
                    return {
                      type: 'table footnote',
                      message:
                        'This action will entirely remove the table footnote from the list  because it will no longer be used.',
                    }
                  default:
                    return {
                      type: 'table general note',
                      message:
                        'This action will entirely remove the table general note.',
                    }
                }
              })()

              if (node.type === schema.nodes.footnote) {
                decorations.push(
                  Decoration.widget(
                    pos + 2,

                    deleteFootnoteWidget(
                      node,
                      props,
                      footnote.type,
                      footnote.message,
                      node.attrs.id,
                      tableElement
                    ),
                    {
                      key: node.attrs.id,
                    }
                  )
                )
              }
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
