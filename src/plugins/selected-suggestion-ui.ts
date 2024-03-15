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

import { trackChangesPluginKey } from '@manuscripts/track-changes-plugin'
import { ManuscriptNode } from '@manuscripts/transform'
import { isEqual } from 'lodash'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

/**
 * This plugin view will handle adding dom event listener to the changed text/node,
 * and clean them up when the change it's not in a pending/accepted state
 */
class SuggestionView {
  private view: EditorView

  constructor(view: EditorView) {
    this.view = view
    this.addEventListener(view)
    this.update(view, undefined)
  }

  update(view: EditorView, prevState?: EditorState) {
    this.view = view
    if (!prevState) {
      return
    }

    const oldChanges =
      trackChangesPluginKey.getState(prevState)?.changeSet.changes || []
    const newChangeSet = trackChangesPluginKey.getState(view.state)?.changeSet

    if (newChangeSet && !isEqual(oldChanges, newChangeSet.changes)) {
      this.addEventListener(view)

      // clean old changes listener
      oldChanges.map((change) => {
        if (
          !newChangeSet.get(change.id) ||
          newChangeSet.get(change.id)?.dataTracked.status === 'rejected'
        ) {
          const dom = view.dom.querySelector(`[data-track-id="${change.id}"]`)
          dom?.removeEventListener('click', this.listener)
        }
      })
    }
  }

  destroy() {
    this.view.dom
      .querySelectorAll(
        '[data-track-status="pending"], [data-track-status="accepted"]'
      )
      .forEach((dom) => {
        if (dom.parentElement?.parentElement?.classList.contains('keyword')) {
          return
        }
        dom.removeEventListener('click', this.listener)
      })
  }

  private addEventListener(view: EditorView) {
    view.dom
      .querySelectorAll(
        '[data-track-status="pending"], [data-track-status="accepted"]'
      )
      .forEach((dom) => {
        if (dom.parentElement?.parentElement?.classList.contains('keyword')) {
          return
        }
        dom.addEventListener('click', this.listener)
      })
  }

  private listener = (e: Event) => {
    const changeId = (e.currentTarget as HTMLElement).getAttribute(
      'data-track-id'
    )
    this.view.dispatch(this.view.state.tr.setMeta(SET_SUGGESTION_ID, changeId))
  }
}

const getTrackChangesData = (node: ManuscriptNode) => {
  const trackChangesMark = node.marks.find(
    (mark) =>
      (mark.type.name === 'tracked_insert' ||
        mark.type.name === 'tracked_delete') &&
      mark.attrs.dataTracked
  )
  return trackChangesMark?.attrs?.dataTracked
}

interface SelectedSuggestionProps {
  setEditorSelectedSuggestion: (id?: string) => void
}

export const SET_SUGGESTION_ID = 'SET_SELECTED_SUGGESTION_ID'

const CLEAR_SUGGESTION_ID = 'CLEAR_SUGGESTION_ID'

export const selectedSuggestionKey = new PluginKey<DecorationSet>(
  'selected_suggestion'
)

/**
 * This plugin add decoration for the tracked text/node suggestion,
 * and the plugin view will add click listener for the changed views
 */
export default (props: SelectedSuggestionProps) =>
  new Plugin<DecorationSet>({
    key: selectedSuggestionKey,
    view: (view) => new SuggestionView(view),
    state: {
      init: () => DecorationSet.empty,
      apply: (tr, value, _, state) => {
        const suggestionId = tr.getMeta(SET_SUGGESTION_ID)

        if (suggestionId) {
          return buildSelectedSuggestionDecoration(suggestionId, state, props)
        }

        if (
          tr.getMeta(CLEAR_SUGGESTION_ID) ||
          tr.getMeta('track-changes-refresh-changes')
        ) {
          props.setEditorSelectedSuggestion(undefined)
          return DecorationSet.empty
        }

        return value
      },
    },
    props: {
      handleClick(view: EditorView, pos: number) {
        const nodeClicked = view.state.doc.nodeAt(pos)
        const trackChangesData = nodeClicked && getTrackChangesData(nodeClicked)
        if (!trackChangesData) {
          if (selectedSuggestionKey.getState(view.state)?.find().length) {
            view.dispatch(view.state.tr.setMeta(CLEAR_SUGGESTION_ID, true))
            props.setEditorSelectedSuggestion(undefined)
          }
        }
      },
      decorations: (state) => selectedSuggestionKey.getState(state),
    },
  })

const buildSelectedSuggestionDecoration = (
  suggestionId: string,
  state: EditorState,
  props: SelectedSuggestionProps
) => {
  const change = trackChangesPluginKey
    .getState(state)
    ?.changeSet.get(suggestionId)
  const decorations: Decoration[] = []

  if (change) {
    const decoration =
      change.type === 'text-change' ? Decoration.inline : Decoration.node
    decorations.push(
      decoration(change.from, change.to, {
        class: 'selected-suggestion',
        key: change.id,
      })
    )
    props.setEditorSelectedSuggestion(change.id)
  }

  return DecorationSet.create(state.doc, decorations)
}
