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

import CloseIconDark from '@manuscripts/assets/react/CloseIconDark'
import { Model, ObjectTypes } from '@manuscripts/json-schema'
import { Capabilities } from '@manuscripts/style-guide'
import type { KeywordNode } from '@manuscripts/transform'
import { generateID, ManuscriptNode } from '@manuscripts/transform'
import { Node } from 'prosemirror-model'
import {
  NodeSelection,
  Plugin,
  PluginKey,
  Transaction,
} from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { createElement } from 'react'
import ReactDOM from 'react-dom'

import {
  // isRejectedInsert,
  getChangeClasses,
  // isDeleted,
  isPending,
  isTracked,
} from '../lib/track-changes-utils'

export const keywordsKey = new PluginKey('keywords')

interface PluginState {
  keywordNodes: KeywordNodes
}

interface KeyworsProps {
  getModel: <T extends Model>(id: string) => T | undefined
  getCapabilities: () => Capabilities
}

type KeywordNodes = Array<[KeywordNode, number]>

const isKeywordnNode = (node: ManuscriptNode): node is KeywordNode =>
  node.type === node.type.schema.nodes.keyword

const buildKeywordNodes = (doc: ManuscriptNode): KeywordNodes => {
  const keywordNodes: KeywordNodes = []

  doc.descendants((node: Node, pos: number) => {
    if (isKeywordnNode(node)) {
      keywordNodes.push([node, pos])
    }
  })

  return keywordNodes
}

const keywordsUpdated = (transactions: readonly Transaction[]): boolean =>
  transactions.some((tr) => {
    const metaDeleted = tr.getMeta('keywordsUpdated')

    return metaDeleted
  })

const buildDecorations = (
  keywordNodes: KeywordNodes,
  getCapabilities: () => Capabilities
) => {
  const decorations: Decoration[] = []
  console.log('keywordNodes', keywordNodes)
  for (const [node, pos] of keywordNodes) {
    const nodeClasses = [...getChangeClasses(node)]
    if (!isTracked(node)) {
      nodeClasses.push('no-tracking')
    }
    const classesDecoration = Decoration.node(pos, pos + node.nodeSize, {
      class: nodeClasses.join(' '),
    })
    decorations.push(classesDecoration)

    if (!isPending(node) && getCapabilities().editArticle) {
      const removeIconDecoration = Decoration.widget(
        pos + node.nodeSize - 1,
        () => {
          const closeIconWrapper = document.createElement('span')
          closeIconWrapper.classList.add('delete-keyword')
          ReactDOM.render(
            createElement(CloseIconDark, {
              height: 8,
              width: 8,
              color: '#353535',
            }),
            closeIconWrapper
          )
          return closeIconWrapper
        },
        { side: -1 }
      )
      decorations.push(removeIconDecoration)
    }
  }
  return decorations
}

/**
 * This plugin updates the contents of a Keywords element in the document (if present) when keywords are modified in the manuscript metadata.
 */
export default (props: KeyworsProps) => {
  return new Plugin<PluginState>({
    key: keywordsKey,
    state: {
      init(config, instance): PluginState {
        const keywordNodes = buildKeywordNodes(instance.doc)

        return {
          keywordNodes,
        }
      },

      apply(tr, value, oldState, newState): PluginState {
        const keywordNodes = buildKeywordNodes(newState.doc)

        return {
          keywordNodes,
        }
      },
    },

    appendTransaction(transactions, oldState, newState) {
      if (!keywordsUpdated(transactions)) {
        return
      }

      const keywordsElements: Array<{
        node: ManuscriptNode
        pos: number
      }> = []

      const { tr } = newState

      tr.doc.descendants((node, pos) => {
        if (node.type === node.type.schema.nodes.keywords_element) {
          keywordsElements.push({
            node,
            pos,
          })
        }
      })

      if (keywordsElements.length) {
        for (const { node, pos } of keywordsElements) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            id: node.attrs.id || generateID(ObjectTypes.KeywordsElement),
          })
        }

        // create a new NodeSelection
        // as selection.map(tr.doc, tr.mapping) loses the NodeSelection
        if (tr.selection instanceof NodeSelection) {
          tr.setSelection(NodeSelection.create(tr.doc, tr.selection.from))
        }
        tr.setMeta('origin', keywordsKey)
        return tr
      }
    },
    props: {
      decorations(state) {
        const { keywordNodes } = keywordsKey.getState(state)
        return DecorationSet.create(
          state.doc,
          buildDecorations(keywordNodes, props.getCapabilities)
        )
      },
    },
  })
}
