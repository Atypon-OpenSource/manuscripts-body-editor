/*!
 * © 2023 Atypon Systems LLC
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
import { getMarkDecoration } from '@manuscripts/style-guide'
import {
  CHANGE_OPERATION,
  CHANGE_STATUS,
  NodeAttrChange,
  NodeChange,
  trackChangesPluginKey,
} from '@manuscripts/track-changes-plugin'
import { schema } from '@manuscripts/transform'
import { EditorState, Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

type TrackingMarkProps = {
  addAttrsTrackingButton: (changeId: string) => HTMLDivElement
}

/**
 * This plugin adds tracking marks for PM node that has just attributes without content
 * Like: (bibliography_item, citation, equation, inline_equation, figure)
 */
export default (props: TrackingMarkProps) =>
  new Plugin<DecorationSet>({
    state: {
      init: (tr, state) => {
        return DecorationSet.create(state.doc, buildDecorations(state, props))
      },
      apply: (tr, decorationSet, oldState, newState) => {
        const meta = tr.getMeta('track-changes-set-change-statuses')

        if (meta) {
          return DecorationSet.create(
            newState.doc,
            buildDecorations(newState, props)
          )
        }

        return decorationSet
      },
    },
    props: {
      decorations: (state) => {
        return DecorationSet.create(state.doc, buildDecorations(state, props))
      },
    },
  })

const buildDecorations = (state: EditorState, props: TrackingMarkProps) => {
  const changeSet = trackChangesPluginKey.getState(state)?.changeSet

  if (!changeSet) {
    return []
  }

  const metaNodeChanges = [
    ...(changeSet.nodeChanges as NodeChange[]),
    ...(changeSet.nodeAttrChanges as NodeAttrChange[]),
  ].filter(({ nodeType }) => nodeType === schema.nodes.bibliography_item.name)

  const decorations: Decoration[] = []

  metaNodeChanges.map((change) => {
    const markDecoration = getMarkDecoration(change.dataTracked)

    decorations.push(
      Decoration.node(change.from, change.to, markDecoration, { id: change.id })
    )

    if (
      change.type === 'node-attr-change' &&
      change.dataTracked.status === CHANGE_STATUS.pending &&
      change.dataTracked.operation === CHANGE_OPERATION.set_node_attributes
    ) {
      decorations.push(
        Decoration.widget(
          change.from + 1,
          props.addAttrsTrackingButton(change.id),
          { key: change.id }
        )
      )
    }
  })

  return decorations
}
