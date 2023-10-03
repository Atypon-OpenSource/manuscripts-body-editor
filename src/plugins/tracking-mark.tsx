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
import { getMarkStyle, TrackAttrsButton } from '@manuscripts/style-guide'
import {
  NodeAttrChange,
  NodeChange,
  trackChangesPluginKey,
} from '@manuscripts/track-changes-plugin'
import { schema } from '@manuscripts/transform'
import { EditorState, Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import React from 'react'

type RenderReactComponent = (
  child: React.ReactElement,
  container: HTMLElement
) => void

type TrackingMarkProps = {
  renderReactComponent: RenderReactComponent
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
    const { style, className, showAttrsPopper } = getMarkStyle(
      change.dataTracked
    )

    decorations.push(
      Decoration.node(
        change.from,
        change.to,
        {
          class: className,
          style: `background: ${style.background}; text-decoration: ${style.textDecoration}; display: ${style.display}; position: relative;`,
        },
        { id: change.id }
      )
    )

    if (change.type === 'node-attr-change' && showAttrsPopper) {
      decorations.push(
        Decoration.widget(
          change.from + 1,
          addAttrsTrackingButton(change, props),
          { key: change.id }
        )
      )
    }
  })

  return decorations
}

const addAttrsTrackingButton = (
  change: NodeAttrChange,
  props: TrackingMarkProps
) => {
  const el = document.createElement('div')

  props.renderReactComponent(<TrackAttrsButton changeId={change.id} />, el)

  return el
}
