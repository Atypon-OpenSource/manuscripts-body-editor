/*!
 * © 2024 Atypon Systems LLC
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
import { CHANGE_STATUS, TrackedAttrs } from '@manuscripts/track-changes-plugin'
import {
  ManuscriptEditorState,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { ResolvedPos } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { isNodeSelection, isTextSelection } from '../commands'

export const selectedSuggestionKey = new PluginKey<PluginState>(
  'selected-suggestion'
)

export interface PluginState {
  decorations: DecorationSet
  suggestion?: TrackedAttrs
}

export default () => {
  return new Plugin<PluginState>({
    key: selectedSuggestionKey,
    state: {
      init: (_, state) => buildPluginState(state),
      apply: (tr, value, oldState, newState) => buildPluginState(newState),
    },
    props: {
      decorations: (state) => {
        const suggestion = selectedSuggestionKey.getState(state)
        return suggestion?.decorations || DecorationSet.empty
      },
    },
  })
}

const buildPluginState = (state: ManuscriptEditorState): PluginState => {
  if (isTextSelection(state.selection)) {
    const $cursor = state.selection.$cursor
    if (!$cursor) {
      return empty
    }
    const selection = getEffectiveSelection(state.doc, $cursor)
    if (!selection) {
      return empty
    }
    if (selection.node.isText) {
      return buildTextDecoration(state.doc, selection)
    } else {
      return buildNodeDecoration(state.doc, selection)
    }
  } else if (isNodeSelection(state.selection)) {
    return buildNodeDecoration(state.doc, state.selection)
  }
  return empty
}

type Selection = {
  node: ManuscriptNode
  from: number
  to: number
}

const getEffectiveSelection = (doc: ManuscriptNode, $pos: ResolvedPos) => {
  const pos = $pos.pos
  let current
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth)
    if (node.attrs.dataTracked) {
      current = {
        node,
        from: $pos.before(depth),
        to: $pos.after(depth),
      }
    } else {
      break
    }
  }
  if (current) {
    return current
  }
  const node = doc.nodeAt(pos)
  if (node?.isText) {
    const from = pos - $pos.textOffset
    const to = from + node.nodeSize
    return {
      node,
      from,
      to,
    }
  }
}

const buildNodeDecoration = (doc: ManuscriptNode, selection: Selection) => {
  const node = selection.node
  const suggestion = node.attrs.dataTracked?.[0]
  if (!suggestion?.status || suggestion.status === CHANGE_STATUS.rejected) {
    return empty
  }
  const from = selection.from
  const to = selection.to
  //hack for keywords since they're really inline nodes but not
  //marked as such in the schema
  const inline = node.type === schema.nodes.keyword || node.isInline
  const decoration = Decoration.node(from, to, {
    nodeName: inline ? 'span' : 'div',
    class: 'selected-suggestion',
  })
  return {
    suggestion,
    decorations: DecorationSet.create(doc, [decoration]),
  }
}

const buildTextDecoration = (doc: ManuscriptNode, selection: Selection) => {
  const node = selection.node
  const suggestion = getTrackedMark(node)?.attrs.dataTracked
  if (!suggestion) {
    return empty
  }
  const from = selection.from
  const to = selection.to
  const decoration = Decoration.inline(from, to, {
    nodeName: 'span',
    class: 'selected-suggestion',
  })
  return {
    suggestion,
    decorations: DecorationSet.create(doc, [decoration]),
  }
}

const trackedMarkTypes = new Set([
  schema.marks.tracked_insert,
  schema.marks.tracked_delete,
])
const getTrackedMark = (node: ManuscriptNode) => {
  for (const mark of node.marks) {
    if (trackedMarkTypes.has(mark.type)) {
      return mark
    }
  }
}

const empty = {
  decorations: DecorationSet.empty,
}
