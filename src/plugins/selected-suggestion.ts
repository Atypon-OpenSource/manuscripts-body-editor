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
import {
  CHANGE_OPERATION,
  CHANGE_STATUS,
  TrackedAttrs,
  TrackedChange,
} from '@manuscripts/track-changes-plugin'
import {
  DataTrackedAttrs,
  ManuscriptEditorState,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { ResolvedPos } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { isTextSelection } from '../commands'
import { isTracked } from '../lib/track-changes-utils'
import { getSelectionChangeGroup } from '../selection'

export const selectedSuggestionKey = new PluginKey<PluginState>(
  'selected-suggestion'
)

type Selection = {
  node: ManuscriptNode
  from: number
  to: number
}
export interface PluginState {
  decorations: DecorationSet
  suggestion?: TrackedAttrs
}

const EMPTY: PluginState = {
  decorations: DecorationSet.empty,
}

/**
 * This plugin is responsible for designating a single suggestion as
 * "selected" based on the current
 * [editor selection]{@link ManuscriptEditorState#selection}.
 *
 * The selected suggestion is wrapped with a "selected-suggestion"
 * decoration to apply different styling to it in the editor.
 *
 * For node views that render other nodes (e.g. the `bibliography_element`
 * view is responsible for rendering `bibliography_item` nodes), the
 * decoration has to be applied manually, for which the
 * selected suggestion (if any) is [provided in the state]{@link PluginState#suggestion}.
 */
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
  const selection = state.selection
  const changes = getSelectionChangeGroup(state)
  if (changes.length) {
    return buildGroupOfChangesDecoration(state.doc, changes)
  }
  const $pos =
    isTextSelection(selection) && selection.$cursor
      ? selection.$cursor
      : selection.$to
  if (!$pos) {
    return EMPTY
  }
  const effective = getEffectiveSelection($pos)

  if (!effective) {
    return EMPTY
  }
  if (effective.node.isText) {
    return buildTextDecoration(state.doc, effective)
  } else {
    return buildNodeDecoration(state.doc, effective)
  }
}

/**
 * Find the node containing `$pos` with the _least depth_ (closest to the root)
 * that changed. This is mainly for cases where inserting a node automatically
 * inserts a bunch of children (e.g. inserting a `figure_element` automatically
 * inserts a `figure`, `figure_caption`, etc.)
 * @param $pos
 */
const getEffectiveSelection = ($pos: ResolvedPos) => {
  let current
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth)
    if (
      node.attrs.dataTracked &&
      !node.attrs.dataTracked?.find(
        (c: DataTrackedAttrs) => c.operation === 'reference'
      )
    ) {
      current = {
        node,
        from: $pos.before(depth),
        to: $pos.after(depth),
      }
    }
  }
  if (current) {
    return current
  }
  const parent = $pos.parent
  const child = parent.childBefore($pos.parentOffset)
  const node = child.node
  if (node) {
    const from = $pos.start() + child.offset
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
    return EMPTY
  }
  const from = selection.from
  const to = selection.to
  //hack for keywords since they're really inline nodes but not
  //marked as such in the schema
  const inline = node.type === schema.nodes.keyword || node.isInline
  const decorationType = inline ? Decoration.inline : Decoration.node
  const decoration = decorationType(from, to, {
    class: 'selected-suggestion',
  })
  return {
    suggestion,
    decorations: DecorationSet.create(doc, [decoration]),
  }
}

const buildTextDecoration = (doc: ManuscriptNode, selection: Selection) => {
  const node = selection.node
  let suggestion = getTrackedMark(node)?.attrs.dataTracked as TrackedAttrs

  if (!suggestion) {
    for (const mark of node.marks) {
      if (isTracked(mark)) {
        suggestion = mark.attrs.dataTracked[0] as TrackedAttrs
      }
    }
  }

  if (!suggestion) {
    return EMPTY
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

const buildGroupOfChangesDecoration = (
  doc: ManuscriptNode,
  changes: TrackedChange[]
) => {
  const decorations = []
  if (changes[0].dataTracked.operation === CHANGE_OPERATION.structure) {
    changes.map((c) =>
      decorations.push(
        Decoration.node(c.from, c.to, { class: 'selected-suggestion' })
      )
    )
  } else {
    const from = changes[0].from,
      to = changes[changes.length - 1].to
    decorations.push(
      Decoration.inline(from, to, {
        class: 'selected-suggestion',
      })
    )
  }
  return {
    decorations: DecorationSet.create(doc, decorations),
    suggestion: changes[0].dataTracked,
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
