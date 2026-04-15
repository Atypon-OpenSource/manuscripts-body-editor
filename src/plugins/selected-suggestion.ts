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
  isTracked,
  trackChangesPluginKey,
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
import { Plugin, PluginKey, Transaction } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { isTextSelection } from '../commands'
import { getSelectionChangeGroup } from '../selection'

export const selectedSuggestionKey = new PluginKey<PluginState>(
  'selected-suggestion'
)

type EffectiveSelection = {
  node: ManuscriptNode
  from: number
  to: number
}

export interface PluginState {
  decorations: Decoration[]
  suggestion?: TrackedAttrs
  highlightedAuthorId?: string
  highlightDecorations: Decoration[]
}

const EMPTY_DECOR = {
  decorations: [] as Decoration[],
}
export const HIGHLIGHT_SELECTOR = 'highlighted-author-change'

/**
 * This plugin is responsible for:
 * 1. designating a single suggestion as * "selected" based on the current
 *    [editor selection]{@link ManuscriptEditorState#selection}.
 * 2. Highlighting changes made by a selected author to distinguish them from the rest of changes  (highlightedAuthorId)
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
      apply: (tr, value, oldState, newState) =>
        buildPluginState(newState, oldState, tr),
    },
    props: {
      decorations: (state) => {
        const s = selectedSuggestionKey.getState(state)
        if (s) {
          return DecorationSet.create(state.doc, [
            ...s.decorations,
            ...s.highlightDecorations,
          ])
        }
        return DecorationSet.empty
      },
    },
  })
}

const buildPluginState = (
  state: ManuscriptEditorState,
  oldState?: ManuscriptEditorState,
  tr?: Transaction
): PluginState => {
  const prevState = oldState && selectedSuggestionKey.getState(oldState)
  const selectionDecor = buildDecorationsForSelection(state)
  const newState: PluginState = {
    decorations: selectionDecor.decorations,
    highlightDecorations: prevState ? prevState.highlightDecorations : [],
    highlightedAuthorId: prevState ? prevState.highlightedAuthorId : '',
  }
  if (selectionDecor.suggestion) {
    newState.suggestion = selectionDecor.suggestion
  }

  if (tr) {
    const receivedAuthorId = tr.getMeta(selectedSuggestionKey)
    if (typeof receivedAuthorId === 'string' && !receivedAuthorId) {
      // received empty string - reset
      newState.highlightDecorations = []
      newState.highlightedAuthorId = ''
    } else if (tr.docChanged || receivedAuthorId) {
      let authorId =
        tr.getMeta(selectedSuggestionKey) || newState.highlightedAuthorId || ''

      const isFreshChangeSet = tr.getMeta('origin') === trackChangesPluginKey // required to recalc decors on fresh positions after tc plugin rebuilt the changeSet
      if (isFreshChangeSet || receivedAuthorId) {
        newState.highlightDecorations = buildHighlightDecorations(
          state,
          authorId,
          tr
        )
      }
      newState.highlightedAuthorId = authorId
    }
  }

  return newState
}

function buildDecorationsForSelection(state: ManuscriptEditorState): {
  decorations: Decoration[]
  suggestion?: TrackedAttrs
} {
  const selection = state.selection
  const changes = getSelectionChangeGroup(state)
  if (changes.length) {
    return buildGroupOfChangesDecoration(changes)
  }
  /* the code below implies that we might not have any changes returned from getSelectionChangeGroup, but
     still there can be some changes at the selection, which doesnt make any sense and shouldn't be possible as far as I can see
     - most likely it has to be if (changes.length > 1) above and not if (changes.length) -  that would be consistent with the article-editors selection logic
  */
  const $pos =
    isTextSelection(selection) && selection.$cursor
      ? selection.$cursor
      : selection.$to
  if (!$pos) {
    return EMPTY_DECOR
  }
  const effective = getEffectiveSelection($pos)

  if (!effective) {
    return EMPTY_DECOR
  }
  if (effective.node.isText) {
    return buildTextDecoration(effective)
  } else {
    return buildNodeDecoration(effective)
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
    // @TODO - abstract reference processing to tc-plugin
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
  // if selection is longer than a text node by a single char, still select the previous node
  // @TODO - define how selection should behave when multiple text nodes are selected at once - which tracked-changes should be highlighted? (maybe multiple highlights)
  const child = parent.childBefore(Math.max($pos.parentOffset - 1, 0))
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

const buildNodeDecoration = (
  selection: EffectiveSelection,
  className = 'selected-suggestion'
) => {
  const node = selection.node
  const suggestion = node.attrs.dataTracked?.[0]
  if (!suggestion?.status || suggestion.status === CHANGE_STATUS.rejected) {
    return EMPTY_DECOR
  }
  const from = selection.from
  const to = selection.to
  //hack for keywords since they're really inline nodes but not
  //marked as such in the schema
  const inline = node.type === schema.nodes.keyword || node.isInline
  const decorationType = inline ? Decoration.inline : Decoration.node
  const decoration = decorationType(from, to, {
    class: className,
  })
  return {
    suggestion: suggestion,
    decorations: [decoration],
  }
}

const buildTextDecoration = (
  selection: EffectiveSelection,
  className = 'selected-suggestion'
) => {
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
    return EMPTY_DECOR
  }
  const from = selection.from
  const to = selection.to

  const decoration = Decoration.inline(from, to, {
    nodeName: 'span',
    class: className,
  })
  return {
    suggestion,
    decorations: [decoration],
  }
}

const buildGroupOfChangesDecoration = (
  changes: TrackedChange[],
  className = 'selected-suggestion'
) => {
  const decorations = []
  if (changes[0].dataTracked.operation === CHANGE_OPERATION.structure) {
    changes.map((c) =>
      decorations.push(Decoration.node(c.from, c.to, { class: className }))
    )
  } else {
    // interesting implication that if changes are grouped but not structural they can only be inlines
    const from = changes[0].from,
      to = changes[changes.length - 1].to
    decorations.push(
      Decoration.inline(from, to, {
        class: className,
      })
    )
  }
  return {
    decorations: decorations,
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

function buildHighlightDecorations(
  state: ManuscriptEditorState,
  authorId: string,
  tr?: Transaction
) {
  const decorations: Decoration[] = []

  trackChangesPluginKey
    .getState(state)
    ?.changeSet.groupChanges.forEach((group) => {
      if (group[0].dataTracked.authorID !== authorId) {
        return
      }
      const lastChange = group[group.length - 1]
      if (
        group[0].from < 0 ||
        lastChange.to > state.doc.content.size ||
        group[0].from > lastChange.to
      ) {
        return
      }
      if (group.length > 1) {
        const groupDecoration = buildGroupOfChangesDecoration(
          group,
          HIGHLIGHT_SELECTOR
        )
        decorations.push(...groupDecoration.decorations)
        return
      }

      const from = group[0].from
      const to = group[0].to
      let node: ManuscriptNode | undefined
      state.doc.nodesBetween(from, to, (n, pos) => {
        if (pos == from) {
          node = n
        }
        if (node) {
          return false
        }
      })

      if (node) {
        if (node.isText) {
          decorations.push(
            ...buildTextDecoration({ from, to, node }, HIGHLIGHT_SELECTOR)
              .decorations
          )
        } else {
          decorations.push(
            ...buildNodeDecoration({ from, to, node }, HIGHLIGHT_SELECTOR)
              .decorations
          )
        }
      }
    })

  return decorations
}
