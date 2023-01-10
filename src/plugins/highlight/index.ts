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

import { CommentAnnotation } from '@manuscripts/json-schema'
import { ManuscriptEditorState, ManuscriptNode } from '@manuscripts/transform'
import { Plugin, PluginKey, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { findHighlightMarkers } from './findHighlightMarkers'
import {
  HighlightMarker,
  HighlightPluginProps,
  HighlightPluginState,
} from './types'

export const highlightKey = new PluginKey<HighlightPluginState>('highlight')

export const SET_COMMENT = 'SET_COMMENT'

export const hasHighlightTarget = (comment: CommentAnnotation) =>
  comment.target.startsWith('MPHighlight:')

export const getHighlightTarget = (
  comment: CommentAnnotation,
  state: ManuscriptEditorState
) => {
  return highlightKey
    .getState(state)
    ?.highlights.find((item) => item.id === comment._id)
}

export const selectedHighlights = (state: ManuscriptEditorState) => {
  const items: HighlightMarker[] = []
  const { selection } = state
  if (!(selection instanceof TextSelection)) {
    return items
  }

  const { $cursor } = selection as TextSelection
  if (!$cursor) {
    return items
  }

  const { pos } = $cursor
  highlightKey.getState(state)?.highlights.forEach((highlight) => {
    if (highlight.start <= pos && highlight.end >= pos) {
      items.push(highlight)
    }
  })
  return items
}

const buildPluginState = (doc: ManuscriptNode): HighlightPluginState => {
  const highlights = findHighlightMarkers(doc)
  const decorations = DecorationSet.create(
    doc,
    highlights.map((h) =>
      Decoration.inline(h.start, h.end, {
        nodeName: 'span',
        class: 'highlight',
        style: `background: rgba(250, 224, 150, 0.6)`,
      })
    )
  )
  return { highlights, decorations }
}

/**
 * This plugin creates a decoration around each highlight marker start and end pair, and keeps a map of all the highlights.
 */
export default (props: HighlightPluginProps) => {
  return new Plugin<HighlightPluginState>({
    key: highlightKey,
    state: {
      init: (tr, state) => buildPluginState(state.doc),
      // TODO: map the decorations through content changes, and use setMeta to add/remove/update them
      apply: (tr) => {
        const meta = tr.getMeta(highlightKey)

        if (meta) {
          if (SET_COMMENT in meta) {
            props.setCommentTarget(meta[SET_COMMENT])
          }
        }

        return buildPluginState(tr.doc)
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = highlightKey.getState(state)

        if (pluginState) {
          return pluginState.decorations
        }
      },
    },
  })
}
