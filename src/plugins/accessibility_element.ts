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
  ManuscriptNode,
  ManuscriptTransaction,
  schema,
} from '@manuscripts/transform'
import { Plugin, PluginKey, Selection } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

import { createToggleButton } from '../lib/utils'

export interface PluginState {
  expandButtonDecorations: Decoration[]
  expandedElementDecorations: Decoration[]
  expandedElementIDs: Set<string>
}

export const accessibilityElementKey = new PluginKey<PluginState>(
  'accessibility-element'
)

const nodeTypes = [schema.nodes.alt_text, schema.nodes.long_desc]

const handleExpandButtonClick = (view: EditorView, node: ManuscriptNode) => {
  const tr = view.state.tr
  toggleAccessibilitySection(tr, node)
  view.dispatch(tr)
}

const isSelectionWithin = (
  node: ManuscriptNode,
  pos: number,
  selection?: Selection
) => {
  if (!selection || !nodeTypes.includes(node.type)) {
    return false
  }
  const to = pos + node.nodeSize
  return selection.from >= pos && selection.to <= to
}

const buildExpandButtonDecorations = (doc: ManuscriptNode) => {
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    if (node.type.spec.content?.includes('alt_text')) {
      decorations.push(
        Decoration.widget(
          pos + node.nodeSize - 1,
          (view) => {
            const container = document.createElement('div')
            container.className =
              'accessibility_element_expander_button_container'
            container.appendChild(
              createToggleButton(() => handleExpandButtonClick(view, node))
            )
            return container
          },
          {
            key: node.attrs.id,
          }
        )
      )
    }
  })

  return decorations
}

const buildExpandedElementsDecorations = (
  doc: ManuscriptNode,
  expandedElementIDs: Set<string>,
  selection?: Selection
) => {
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    if (
      expandedElementIDs.has(node.attrs.id) ||
      isSelectionWithin(node, pos, selection)
    ) {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          class: 'show_accessibility_element',
        })
      )
    }
  })

  return decorations
}

export default () => {
  return new Plugin<PluginState>({
    key: accessibilityElementKey,
    state: {
      init(config, instance) {
        return {
          expandButtonDecorations: buildExpandButtonDecorations(instance.doc),
          expandedElementDecorations: [],
          expandedElementIDs: new Set(),
        }
      },
      apply(tr, value, oldState, newState) {
        const s = {
          expandButtonDecorations: value.expandButtonDecorations,
          expandedElementDecorations: value.expandedElementDecorations,
          expandedElementIDs: new Set(value.expandedElementIDs),
        }

        if (tr.docChanged) {
          s.expandButtonDecorations = buildExpandButtonDecorations(newState.doc)
        }

        let expandedElementIDsChanged = false
        const meta = tr.getMeta(accessibilityElementKey)
        if (meta) {
          expandedElementIDsChanged = true
          const isExpanded = s.expandedElementIDs.has(meta.id)
          if (
            meta.action === 'add' ||
            (meta.action === 'toggle' && !isExpanded)
          ) {
            s.expandedElementIDs.add(meta.id)
          } else if (
            meta.action === 'remove' ||
            (meta.action === 'toggle' && isExpanded)
          ) {
            s.expandedElementIDs.delete(meta.id)
          }
        }

        if (tr.selectionSet) {
          const $pos = tr.selection.$from
          for (let i = $pos.depth; i >= 0; i--) {
            const node = $pos.node(i)
            if (nodeTypes.includes(node.type)) {
              const parent = $pos.node(i - 1)
              s.expandedElementIDs.add(parent.attrs.id)
              expandedElementIDsChanged = true
              break
            }
          }
        }

        if (expandedElementIDsChanged) {
          s.expandedElementDecorations = buildExpandedElementsDecorations(
            newState.doc,
            s.expandedElementIDs
          )
        }
        return s
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = accessibilityElementKey.getState(state)
        if (pluginState) {
          return DecorationSet.create(state.doc, [
            ...pluginState.expandButtonDecorations,
            ...pluginState.expandedElementDecorations,
          ])
        }
      },
    },
  })
}

export const expandAccessibilitySection = (
  tr: ManuscriptTransaction,
  node: ManuscriptNode
) => {
  if (node.attrs.id && node.type.spec.content?.includes('alt_text')) {
    tr.setMeta(accessibilityElementKey, {
      action: 'add',
      id: node.attrs.id,
    })
  }
}

export const toggleAccessibilitySection = (
  tr: ManuscriptTransaction,
  node: ManuscriptNode
) => {
  tr.setMeta(accessibilityElementKey, {
    action: 'toggle',
    id: node.attrs.id,
  })
}
