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
  CommentAnnotation,
  isHighlightMarkerNode,
  ManuscriptEditorState,
  ManuscriptNode,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import { Plugin, PluginKey, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export const highlightKey = new PluginKey<
  HighlightPluginState,
  ManuscriptSchema
>('highlight')

export const SET_COMMENT_TARGET = 'SET_COMMENT_TARGET'

export const hasHighlightTarget = (comment: CommentAnnotation) =>
  comment.target.startsWith('MPHighlight:')

export const getHighlightTarget = (
  comment: CommentAnnotation,
  state: ManuscriptEditorState
) => {
  if (hasHighlightTarget(comment)) {
    const highlights = getHighlights(state)

    for (const item of highlights) {
      if (item.rid === comment.target) {
        return item
      }
    }
  }
}

export const getHighlightText = (
  highlight: HighlightWithNode,
  state: ManuscriptEditorState
): string | undefined => {
  if (highlight.start !== undefined && highlight.end !== undefined) {
    return state.doc.textBetween(highlight.start, highlight.end, '\n')
  }
}

export const selectedHighlights = (state: ManuscriptEditorState) => {
  const items: HighlightWithNode[] = []

  if (state.selection instanceof TextSelection) {
    const { $cursor } = state.selection as TextSelection

    if ($cursor) {
      const { pos } = $cursor

      const highlights = getHighlights(state)

      for (const highlight of highlights) {
        if (
          highlight.start !== undefined &&
          highlight.start <= pos &&
          highlight.end !== undefined &&
          highlight.end >= pos
        ) {
          items.push(highlight)
        }
      }
    }
  }

  return items
}

const getHighlightPluginState = (state: ManuscriptEditorState) =>
  highlightKey.getState(state) as HighlightPluginState

export const getHighlights = (state: ManuscriptEditorState) =>
  getHighlightPluginState(state).highlights.values()

interface HighlightWithNode {
  start?: number
  end?: number
  rid?: string
  text?: string
  node?: ManuscriptNode
}

interface HighlightPluginState {
  highlights: Map<string, HighlightWithNode>
  decorations: DecorationSet<ManuscriptSchema>
}

const buildHighlightsMap = (doc: ManuscriptNode) => {
  const highlights = new Map<string, HighlightWithNode>()

  doc.descendants((node: ManuscriptNode, pos: number) => {
    if (isHighlightMarkerNode(node)) {
      const { position, rid } = node.attrs

      switch (position) {
        case 'start':
          highlights.set(rid, {
            start: pos + 1,
            rid,
            node,
          })
          break

        case 'end':
          const highlight = highlights.get(rid)

          if (highlight && highlight.start !== undefined) {
            // const text = doc.textBetween(highlight.start, pos, '\n')

            highlights.set(rid, {
              ...highlight,
              end: pos,
              // text,
            })
          }

          break
      }
    }
  })

  return highlights
}

const buildDecorations = (highlights: Map<string, HighlightWithNode>) => {
  const decorations: Decoration[] = []

  for (const highlight of highlights.values()) {
    const { start, end } = highlight

    if (start !== undefined && end !== undefined && start < end) {
      decorations.push(
        Decoration.inline(start, end, {
          nodeName: 'span',
          class: 'highlight',
          style: 'background: #FFE08B', // TODO: use Highlight.color
        })
      )
    }
  }

  return decorations
}

const buildPluginState = (doc: ManuscriptNode): HighlightPluginState => {
  const highlights = buildHighlightsMap(doc)

  const decorations = DecorationSet.create(doc, buildDecorations(highlights))

  return { highlights, decorations }
}

interface Props {
  setCommentTarget: (target?: string) => void
}

export default (props: Props) => {
  return new Plugin<HighlightPluginState, ManuscriptSchema>({
    key: highlightKey,
    state: {
      init: (tr, state) => buildPluginState(state.doc),
      // TODO: map the decorations through content changes, and use setMeta to add/remove/update them
      apply: tr => {
        const meta = tr.getMeta(highlightKey)

        if (meta) {
          if (SET_COMMENT_TARGET in meta) {
            props.setCommentTarget(meta[SET_COMMENT_TARGET])
          }
        }

        return buildPluginState(tr.doc)
      },
    },
    props: {
      decorations: state => highlightKey.getState(state).decorations,
    },
  })
}
