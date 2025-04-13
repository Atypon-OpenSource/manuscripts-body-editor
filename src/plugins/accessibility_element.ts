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
import { trackChangesPluginKey } from '@manuscripts/track-changes-plugin'
import { ManuscriptNode, schema } from '@manuscripts/transform'
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state'
import { findParentNodeClosestToPos } from 'prosemirror-utils'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

import { createAccessibilityElementsButton } from '../components/views/AccessibilityElementsExpanderButton'
import { getEditorProps } from './editor-props'
import { selectedSuggestionKey } from './selected-suggestion'

export interface PluginState {
  buttonsDecoration: Decoration[]
  visibilityDecoration: Decoration[]
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

const createExpandButtonWidget = (
  view: EditorView,
  getPos: () => number | undefined
): HTMLElement => {
  const props = getEditorProps(view.state)
  return createAccessibilityElementsButton(props, view, () => getPos() || 0)
}

const buildExpandButtonWidget = (doc: ManuscriptNode) => {
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    if (parentOfAccessibilityElement.has(node.type)) {
      decorations.push(
        Decoration.widget(pos + node.nodeSize - 1, createExpandButtonWidget)
      )
      return false
    }
  })

  return decorations
}

const buildVisibilityDecoration = (
  doc: ManuscriptNode,
  shownNodes: Set<string>
) => {
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    if (shownNodes.has(node.attrs.id)) {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          class: 'show_accessibility_element',
        })
      )
      return false
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

export default () => {
  return new Plugin<PluginState>({
    key: accessibilityElementKey,
    state: {
      init(config, instance) {
        return {
          buttonsDecoration: buildExpandButtonWidget(instance.doc),
          visibilityDecoration: [],
          shownElements: new Set(),
        }
      },
      apply(tr, decorationSet, oldState, newState) {
        const { shownElements } = decorationSet

        const id = getIdOfParentToAccessibilityElement(newState, tr)
        if (id) {
          shownElements.add(id)
          decorationSet.visibilityDecoration = buildVisibilityDecoration(
            newState.doc,
            shownElements
          )
        }

        if (tr.docChanged) {
          decorationSet.buttonsDecoration = buildExpandButtonWidget(
            newState.doc
          )
          decorationSet.visibilityDecoration = buildVisibilityDecoration(
            newState.doc,
            shownElements
          )
        } else {
          const nodeId = tr.getMeta(accessibilityElementKey)
          if (nodeId) {
            ;(shownElements.has(nodeId) && shownElements.delete(nodeId)) ||
              shownElements.add(nodeId)
            decorationSet.visibilityDecoration = buildVisibilityDecoration(
              newState.doc,
              shownElements
            )
          }
        }
        return decorationSet
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = accessibilityElementKey.getState(state)
        if (pluginState) {
          return DecorationSet.create(state.doc, [
            ...pluginState.buttonsDecoration,
            ...pluginState.visibilityDecoration,
          ])
        }
      },
    },
  })
}
