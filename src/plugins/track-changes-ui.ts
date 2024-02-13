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
  trackChangesPluginKey,
  TrackChangesState,
} from '@manuscripts/track-changes-plugin'
import { ManuscriptNode } from '@manuscripts/transform'
import { NodeSelection, Plugin, TextSelection } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

const getTrackChangesData = (node: ManuscriptNode) => {
  const trackChangesMark = node.marks.find(
    (mark) =>
      (mark.type.name === 'tracked_insert' ||
        mark.type.name === 'tracked_delete') &&
      mark.attrs.dataTracked
  )
  return trackChangesMark?.attrs?.dataTracked
}

interface TrackChangesProps {
  setEditorSelectedSuggestion?: (id?: string) => void
}

/**
 * This plugin update the state of selected suggestion and select clicked change node
 */
export default (props: TrackChangesProps) =>
  new Plugin<TrackChangesState>({
    props: {
      handleClick(view: EditorView, pos: number) {
        if (props.setEditorSelectedSuggestion) {
          const nodeClicked = view.state.doc.nodeAt(pos)
          const trackChangesData =
            nodeClicked && getTrackChangesData(nodeClicked)
          if (trackChangesData) {
            props.setEditorSelectedSuggestion(trackChangesData.id)

            const change = trackChangesPluginKey
              .getState(view.state)
              ?.changeSet.get(trackChangesData.id)

            if (change) {
              const { type, from, to } = change
              const selection =
                type === 'text-change'
                  ? TextSelection.create(view.state.tr.doc, from, to)
                  : NodeSelection.create(view.state.tr.doc, from)
              view.dispatch(view.state.tr.setSelection(selection))
            }
          } else {
            props.setEditorSelectedSuggestion(undefined)
          }
        }
      },
    },
  })
