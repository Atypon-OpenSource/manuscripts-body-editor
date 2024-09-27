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
import { Plugin, PluginKey, TextSelection } from 'prosemirror-state'
import {
  findParentNodeClosestToPos,
  findParentNodeOfType,
} from 'prosemirror-utils'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { isTextSelection } from '../../commands'
import { EditorProps } from '../../configs/ManuscriptsEditor'
import {
  findTableInlineFootnoteIds,
  getAlphaOrderIndices,
} from '../../lib/footnotes'
import { placeholderWidget } from '../placeholder'
import {
  deleteFootnoteWidget,
  labelWidget,
  uncitedFootnoteWidget,
} from './widgets'

export interface PluginState {
  inlineFootnotes: [InlineFootnoteNode, number][]
  unusedFootnotes: Map<string, [FootnoteNode, number]>
  footnotes: Map<string, [FootnoteNode, number]>
  footnoteElement?: [FootnotesElementNode, number]
  labels: Map<string, string>
}

export const footnotesKey = new PluginKey<PluginState>('footnotes')

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
  const unusedFootnotes = new Map(footnotes)

  inlineFootnotes.forEach(([node]) => {
    const footnote = node as InlineFootnoteNode
    footnote.attrs.rids.forEach((rid) => {
      const currentFnNode = unusedFootnotes.get(rid)
      if (currentFnNode) {
        // separating used and orphan footnotes
        footnotesReordered.push(currentFnNode[0])
        unusedFootnotes.delete(rid)
      }
    })
  })

  return {
    inlineFootnotes,
    unusedFootnotes,
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
        const attrs = footnote.attrs
        const contents = attrs.rids
          .map((rid) => {
            const currentFnNode = footnotes.get(rid)
            if (currentFnNode) {
              footnotesReordered.push(currentFnNode[0])
            }
            return labels.get(rid)
          })
          .join('')

        // displaying indices
        if (attrs.contents !== contents) {
          tr.setNodeMarkup(pos, undefined, {
            ...footnote.attrs,
            rids: footnote.attrs.rids,
            contents,
          })
        }
      })

      unusedFootnotes.forEach(([node]) => footnotesReordered.push(node))

      // replacing footnotes in footnote element
      const newFnElement = schema.nodes.footnotes_element.create(
        footnoteElement[0].attrs,
        footnotesReordered
      )

      if (newFnElement && footnotes.size > 0) {
        tr.replaceWith(
          footnoteElement[1],
          footnoteElement[1] + footnoteElement[0].nodeSize,
          newFnElement
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
          if (node.type === schema.nodes.footnotes_element) {
            tableInlineFootnoteIds = undefined
            if (parent?.type === schema.nodes.table_element_footer) {
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: 'table-footnotes-element',
                })
              )
              tableInlineFootnoteIds = findTableInlineFootnoteIds(
                state.doc.resolve(pos)
              )
            }
          }

          if (isFootnoteNode(node)) {
            if (!tableInlineFootnoteIds) {
              const id = node.attrs.id
              if (!labels || !labels.has(id)) {
                decorations.push(
                  Decoration.widget(pos + 2, uncitedFootnoteWidget(), {
                    side: -1,
                  })
                )
              } else {
                const label = labels.get(id)
                if (label) {
                  decorations.push(
                    Decoration.widget(pos + 2, labelWidget(label, id), {
                      side: -1,
                    })
                  )
                } else {
                  decorations.push(
                    Decoration.widget(pos + 2, uncitedFootnoteWidget(), {
                      side: -1,
                    })
                  )
                }
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
        })

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
}
