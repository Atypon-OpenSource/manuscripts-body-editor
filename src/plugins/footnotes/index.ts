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
  isInlineFootnoteNode,
  ManuscriptNode,
} from '@manuscripts/transform'
import { isEqual } from 'lodash-es'
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

interface PluginState {
  nodes: [InlineFootnoteNode, number][]
  labels: Map<string, string>
}

export const footnotesKey = new PluginKey<PluginState>('footnotes')

export const buildPluginState = (doc: ManuscriptNode): PluginState => {
  const nodes: [InlineFootnoteNode, number][] = []

  let index = 0
  const labels = new Map<string, string>()

  doc.descendants((node, pos) => {
    if (isInlineFootnoteNode(node)) {
      nodes.push([node, pos])
      labels.set(node.attrs.rid, String(++index))
    }
  })

  return { nodes, labels }
}

const scrollToInlineFootnote = (rid: string, view: EditorView) => {
  view.state.doc.descendants((node, pos) => {
    if (node.attrs.rid === rid) {
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
export default () => {
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
        const contents = labels.get(node.attrs.rid)

        if (node.attrs.contents !== contents) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            contents,
          })
        }
      })

      return tr
    },

    props: {
      decorations: (state) => {
        const decorations: Decoration[] = []

        const { labels } = footnotesKey.getState(state) as PluginState
        if (labels) {
          state.doc.descendants((node, pos) => {
            const { id } = node.attrs

            if (labels.has(id)) {
              decorations.push(
                Decoration.widget(
                  pos + 2,
                  labelWidget(labels.get(id) as string, id),
                  {
                    side: -1,
                  }
                )
              )
            }
          })
        }

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
}
