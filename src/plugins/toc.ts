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
  generateNodeID,
  isSectionNodeType,
  isTOCSectionNode,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state'

import { iterateChildren } from '../lib/utils'

export const tocKey = new PluginKey('toc')

const buildTOCList = (
  list: HTMLUListElement,
  node: ManuscriptNode,
  depth = 1,
  prefix = ''
) => {
  list.classList.add('manuscript-toc-list')

  if (depth > 1) {
    list.classList.add('manuscript-toc-inner-list')
  }

  let index = 1
  node.forEach((child) => {
    if (child.type === schema.nodes.body) {
      for (const childNode of iterateChildren(child)) {
        if (isSectionNodeType(childNode.type) && !isTOCSectionNode(childNode)) {
          const numbering = `${prefix}${index}`

          const firstChildNode = childNode.child(0)

          if (
            firstChildNode.type ===
            firstChildNode.type.schema.nodes.section_title
          ) {
            const item = document.createElement('li')
            item.classList.add('manuscript-toc-list-item')
            item.setAttribute('data-referenced-section', childNode.attrs.id)
            item.setAttribute(
              'data-referenced-section-path-length',
              String(depth)
            )

            item.textContent = `${numbering ? `${numbering}.` : ''} ${
              firstChildNode.textContent || 'Untitled Section'
            }` // TODO: numbering and markup

            list.appendChild(item)
          }

          index++ // TODO: don't increment if excluded from numbering
        }
      }
    }
  })
}

/**
 * This plugin generates the content for a Table of Contents element, if present
 */
export default () => {
  return new Plugin<null>({
    key: tocKey,

    appendTransaction(transactions, oldState, newState) {
      if (
        !transactions.some(
          (transaction) =>
            transaction.docChanged || transaction.getMeta('update')
        )
      ) {
        return
      }

      const { tr } = newState

      const nodesToUpdate: Array<{
        node: ManuscriptNode
        pos: number
        id: string
        contents: string
      }> = []

      tr.doc.descendants((node, pos) => {
        if (node.type === node.type.schema.nodes.toc_element) {
          const list = document.createElement('ul')

          buildTOCList(list, newState.doc)

          const contents = list.outerHTML

          if (contents !== node.attrs.contents) {
            nodesToUpdate.push({
              node,
              pos,
              id: node.attrs.id || generateNodeID(schema.nodes.toc_element),
              contents,
            })
          }
        }
      })

      if (nodesToUpdate.length) {
        for (const { node, pos, id, contents } of nodesToUpdate) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            contents,
            id,
          })
        }

        // create a new NodeSelection
        // as selection.map(tr.doc, tr.mapping) loses the NodeSelection
        if (tr.selection instanceof NodeSelection) {
          tr.setSelection(NodeSelection.create(tr.doc, tr.selection.from))
        }
        tr.setMeta('origin', tocKey)
        return tr
      }
    },
  })
}
