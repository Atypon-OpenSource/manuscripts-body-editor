/*!
 * © 2025 Atypon Systems LLC
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
  skipTracking,
  trackChangesPluginKey,
} from '@manuscripts/track-changes-plugin'
import { ManuscriptNode, schema } from '@manuscripts/transform'
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state'
import { AttrStep } from 'prosemirror-transform'
import { findChildren, findParentNodeClosestToPos } from 'prosemirror-utils'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

import { arrowDown } from '../icons'
import { getInsertPos } from '../lib/utils'
import { selectedSuggestionKey } from './selected-suggestion'

export interface PluginState {
  decorations: Decoration[]
  shownElements: Set<string>
}

export const accessibilityElementKey = new PluginKey<PluginState>(
  'accessibility-element'
)

const parentOfAccessibilityElement = new Set([
  schema.nodes.figure_element,
  schema.nodes.image_element,
  schema.nodes.table_element,
  schema.nodes.embed,
])

const accessibilityElementNods = (node: ManuscriptNode) =>
  node.type === schema.nodes.alt_text || node.type === schema.nodes.long_desc

const insertAccessibilityElementIfMissing = (
  view: EditorView,
  getPos: () => number | undefined
) => {
  const tr = view.state.tr
  const $pos = tr.doc.resolve(getPos() || 0)
  const node = $pos.node()
  const accessibilityElement = findChildren(
    node,
    (child) =>
      child.type === schema.nodes.alt_text ||
      child.type === schema.nodes.long_desc,
    false
  )[0]

  if (!accessibilityElement) {
    const insertPos = getInsertPos(
      schema.nodes.alt_text,
      node,
      $pos.pos - $pos.parentOffset - 1
    )

    tr.insert(insertPos, schema.nodes.alt_text.create()).insert(
      insertPos + 2,
      schema.nodes.long_desc.create()
    )
  }

  view.dispatch(
    skipTracking(tr.setMeta(accessibilityElementKey, node.attrs.id))
  )
}

const createExpandButtonWidget =
  (newNodeId?: string | boolean) =>
  (view: EditorView, getPos: () => number | undefined): HTMLElement => {
    const container = document.createElement('div')
    container.className = 'accessibility_element_expander_button_container'
    const button = document.createElement('button')
    button.className = 'accessibility_element_expander_button'
    button.innerHTML = arrowDown
    button.onclick = () => insertAccessibilityElementIfMissing(view, getPos)
    container.appendChild(button)

    if (newNodeId) {
      setTimeout(
        () =>
          view.dispatch(
            skipTracking(
              view.state.tr.setMeta(accessibilityElementKey, newNodeId)
            )
          ),
        4000
      )
    }
    return container
  }

const buildDecoration = (
  doc: ManuscriptNode,
  shownNodes: Set<string>,
  newNodeId?: string
) => {
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    if (parentOfAccessibilityElement.has(node.type)) {
      decorations.push(
        Decoration.widget(
          pos + node.nodeSize - 1,
          createExpandButtonWidget(node.attrs.id === newNodeId && newNodeId),
          {
            key: node.attrs.id,
          }
        )
      )
    }

    if (shownNodes.has(node.attrs.id)) {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          class: 'show_accessibility_element',
        })
      )
    }
  })

  return decorations
}

// get id of parent to accessibility element if tracked suggestion of them selected
const getIdOfParentToAccessibilityElement = (
  newState: EditorState,
  tr: Transaction
) => {
  const selection = selectedSuggestionKey.getState(newState)?.suggestion
  const changeSet = trackChangesPluginKey.getState(newState)?.changeSet
  if (selection && changeSet) {
    const $pos = tr.doc.resolve(changeSet.get(selection.id)?.from || 0)
    if (accessibilityElementNods($pos.parent)) {
      const contentNode = findParentNodeClosestToPos($pos, (node) =>
        parentOfAccessibilityElement.has(node.type)
      )
      if (contentNode?.node) {
        return contentNode.node.attrs.id
      }
    }
  }
}

// get Id for inserted parent node of accessibility element
function getNewNodeId(tr: Transaction, shownElements: Set<string>) {
  let newNodeId
  tr.steps.map((step) => {
    if (
      step instanceof AttrStep &&
      tr.doc.nodeAt(step.pos) &&
      parentOfAccessibilityElement.has(tr.doc.nodeAt(step.pos)!.type)
    ) {
      newNodeId = step.value
      shownElements.add(step.value)
    }
  })
  return newNodeId
}

export default () => {
  return new Plugin<PluginState>({
    key: accessibilityElementKey,
    state: {
      init(config, instance) {
        return {
          decorations: buildDecoration(instance.doc, new Set()),
          shownElements: new Set(),
        }
      },
      apply(tr, decorationSet, oldState, newState) {
        const { shownElements } = decorationSet
        const selectedNodeId = getIdOfParentToAccessibilityElement(newState, tr)
        if (selectedNodeId) {
          shownElements.add(selectedNodeId)
        }
        const nodeId = tr.getMeta(accessibilityElementKey)
        if (nodeId) {
          ;(shownElements.has(nodeId) && shownElements.delete(nodeId)) ||
            shownElements.add(nodeId)
        }
        if (selectedNodeId || nodeId || tr.docChanged) {
          const newNodeId = getNewNodeId(tr, shownElements)
          decorationSet.decorations = buildDecoration(
            newState.doc,
            shownElements,
            newNodeId
          )
        }
        return decorationSet
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = accessibilityElementKey.getState(state)
        if (pluginState) {
          return DecorationSet.create(state.doc, [...pluginState.decorations])
        }
      },
    },
  })
}
