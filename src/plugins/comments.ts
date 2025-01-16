/*!
 * © 2022 Atypon Systems LLC
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
  CommentNode,
  ManuscriptNode,
  ManuscriptTransaction,
  schema,
} from '@manuscripts/transform'
import { Plugin, PluginKey } from 'prosemirror-state'
import { findChildrenByType, NodeWithPos } from 'prosemirror-utils'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

import {
  Comment,
  CommentAttrs,
  CommentKey,
  CommentRange,
  CommentSelection,
  createCommentMarker,
  getCommentKey,
  HighlightMarkerAttrs,
  InlineComment,
  isReply,
  NodeComment,
} from '../lib/comments'

export const commentsKey = new PluginKey<PluginState>('comments')
const COMMENT_SELECTION = 'comment-selection'
const EMPTY_SELECTION = {}

export interface PluginState {
  decorations: DecorationSet
  comments: Map<string, Comment>
  commentsByKey: Map<CommentKey, Comment[]>
  selection?: CommentSelection
}

/**
 * This plugin creates a icon decoration for both inline and block comment.
 */
export default () => {
  return new Plugin<PluginState>({
    key: commentsKey,
    state: {
      init: (_, state) => {
        return buildPluginState(state.doc)
      },
      apply: (tr, value) => {
        if (tr.docChanged || tr.getMeta(COMMENT_SELECTION)) {
          const selection = tr.getMeta(COMMENT_SELECTION) || value.selection
          return buildPluginState(
            tr.doc,
            selection === EMPTY_SELECTION ? undefined : selection
          )
        }
        return value
      },
    },
    props: {
      decorations: (state) => commentsKey.getState(state)?.decorations,
      handleClick: (view: EditorView, pos: number, e: MouseEvent) => {
        const state = view.state
        const com = commentsKey.getState(state)
        const target = e.target as HTMLElement
        const marker = target.closest('[data-key]') as HTMLElement
        //don't dispatch a transaction if both empty
        if (!marker && !com?.selection) {
          return
        }
        const tr = state.tr
        if (marker) {
          const key = marker.dataset.key as CommentKey
          setCommentSelection(tr, key, undefined, false)
        } else {
          clearCommentSelection(tr)
        }
        view.dispatch(tr)
      },
    },
  })
}

export const setCommentSelection = (
  tr: ManuscriptTransaction,
  key: CommentKey,
  id: string | undefined,
  isNew: boolean
) => {
  tr.setMeta(COMMENT_SELECTION, {
    key,
    id,
    isNew,
  })
  tr.setMeta('origin', commentsKey)
  return tr
}

export const clearCommentSelection = (tr: ManuscriptTransaction) => {
  tr.setMeta(COMMENT_SELECTION, EMPTY_SELECTION)
  tr.setMeta('origin', commentsKey)
  return tr
}

const findCommentRanges = (doc: ManuscriptNode) => {
  const nodes = findChildrenByType(doc, schema.nodes.highlight_marker)

  const ranges = new Map<string, CommentRange>()

  let start

  for (const { node, pos } of nodes) {
    const attrs = node.attrs as HighlightMarkerAttrs
    const position = attrs.position
    if (position === 'point') {
      ranges.set(attrs.id, {
        pos: pos + 1,
        size: 0,
      })
    } else if (position === 'start') {
      start = pos + 1
    } else if (position === 'end' && start) {
      ranges.set(attrs.id, {
        pos: start,
        size: pos - start,
      })
      start = undefined
    }
  }
  return ranges
}

const findComments = (doc: ManuscriptNode) => {
  const comments = findChildrenByType(doc, schema.nodes.comment)

  const commentsByTarget = new Map<string, NodeWithPos[]>()
  for (const comment of comments) {
    const targetID = comment.node.attrs.target
    const list = commentsByTarget.get(targetID) || []
    commentsByTarget.set(targetID, [...list, comment])
  }

  return commentsByTarget
}

const buildPluginState = (
  doc: ManuscriptNode,
  selection?: CommentSelection
) => {
  const commentsByTarget = findComments(doc)
  const ranges = findCommentRanges(doc)

  const decorations: Decoration[] = []
  const allComments: Comment[] = []

  doc.descendants((node, pos) => {
    const id = node.attrs.id
    const comments = commentsByTarget.get(id)
    if (!comments || !comments.length) {
      return
    }

    const target = {
      node,
      pos,
    }

    const nodeComments: NodeComment[] = []
    const highlightComments: InlineComment[] = []
    const pointComments: InlineComment[] = []

    comments
      .map((c) => {
        const attrs = c.node.attrs as CommentAttrs
        const id = attrs.id
        const range = ranges.get(id)
        const key = getCommentKey(attrs, range, node)
        return {
          key,
          node: c.node as CommentNode,
          pos: c.pos,
          target,
          range,
        }
      })
      .forEach((c) => {
        allComments.push(c)
        if (!isReply(c)) {
          if (!c.range) {
            nodeComments.push(c)
          } else if (c.range.size) {
            highlightComments.push(c as InlineComment)
          } else {
            pointComments.push(c as InlineComment)
          }
        }
      })

    for (const comment of highlightComments) {
      const key = comment.key
      const range = comment.range
      decorations.push(createHighlightDecoration(key, range, selection))
    }
    if (pointComments.length) {
      groupByKey(pointComments).forEach((comments, key) => {
        const count = comments.length
        const pos = comments[0].range.pos
        decorations.push(
          createMarkerDecoration(key, 'span', pos, count, selection)
        )
      })
    }
    if (nodeComments.length) {
      const count = nodeComments.length
      const key = nodeComments[0].key
      const tagName = node.isAtom ? 'span' : 'div'
      const dpos = getDecorationPos(node, pos)
      decorations.push(
        createMarkerDecoration(key, tagName, dpos, count, selection)
      )
    }
  })

  return {
    decorations: DecorationSet.create(doc, decorations),
    comments: new Map(allComments.map((c) => [c.node.attrs.id, c])),
    commentsByKey: groupByKey(allComments),
    selection,
  }
}

const groupByKey = <T extends Comment>(comments: T[]): Map<CommentKey, T[]> => {
  const map = new Map()
  for (const comment of comments) {
    const key = comment.key
    const value = map.get(key) || []
    map.set(key, [...value, comment])
  }
  return map
}

const getDecorationPos = (node: ManuscriptNode, pos: number) => {
  switch (node.type) {
    case schema.nodes.paragraph:
      return pos
    case schema.nodes.keywords:
      return pos + 2
    case schema.nodes.affiliations:
      return pos
    default:
      return pos + 1
  }
}

const createHighlightDecoration = (
  key: CommentKey,
  range: CommentRange,
  selection: CommentSelection | undefined
) => {
  const classNames = ['highlight']
  if (key === selection?.key) {
    classNames.push('selected-comment')
  }
  return Decoration.inline(range.pos, range.pos + range.size, {
    nodeName: 'span',
    class: classNames.join(' '),
    'data-key': key,
  })
}

const createMarkerDecoration = (
  key: CommentKey,
  tagName: string,
  pos: number,
  count: number,
  selection: CommentSelection | undefined
) => {
  const isSelected = selection?.key === key
  const toDOM = () => {
    const marker = createCommentMarker(tagName, key, count)
    if (isSelected) {
      marker.classList.add('selected-comment')
    }
    return marker
  }
  return Decoration.widget(pos, toDOM, {
    key: `${key}-${count}-${isSelected}`,
  })
}
