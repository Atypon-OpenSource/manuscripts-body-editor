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
import { ManuscriptNode, schema } from '@manuscripts/transform'
import { Plugin, PluginKey } from 'prosemirror-state'
import { findChildrenByType } from 'prosemirror-utils'
import {Decoration, DecorationSet, EditorView} from 'prosemirror-view'

import {
  Comment,
  CommentAttrs,
  CommentRange,
  getCommentID, getCommentIDForNode, getCommentMarkerID,
  HighlightMarkerAttrs,
  InlineComment,
  NodeComment,
} from '../lib/comments'

export const commentsKey = new PluginKey<PluginState>('comments')
export const SET_COMMENT = 'SET_COMMENT'

interface CommentsPluginProps {
  setSelectedComment: (id?: string) => void
}

export interface PluginState {
  decorations: DecorationSet
  nodeDecorations: Map<string, Decoration>
  comments: Map<string, Comment>
  commentIDs: Map<string, string>
}

/**
 * This plugin creates a icon decoration for both inline and block comment.
 */
export default (props: CommentsPluginProps) => {
  return new Plugin<PluginState>({
    key: commentsKey,
    state: {
      init: (_, state) => {
        return buildPluginState(state.doc)
      },
      apply: (tr, value) => {
        if (tr.docChanged) {
          return buildPluginState(tr.doc)
        }
        return value
      },
    },
    props: {
      decorations: (state) => commentsKey.getState(state)?.decorations,
      handleClick: (view: EditorView, pos: number) => {
        const comments = commentsKey.getState(view.state)
        if (!comments) {
          return
        }
        const decorations = comments.decorations.find(pos, pos)
        if (decorations.length) {
          const decoration = decorations[0]
          console.log(decoration)
          const id = decoration.spec.id
          props.setSelectedComment(id)
        } else {
          props.setSelectedComment(undefined)
        }
      },
    },
  })
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
  const nodes = findChildrenByType(doc, schema.nodes.comment)

  const commentsByTarget = new Map<string, CommentAttrs[]>()
  for (const { node } of nodes) {
    const attrs = node.attrs as CommentAttrs
    const targetID = attrs.target
    const comments = commentsByTarget.get(targetID) || []
    commentsByTarget.set(targetID, [...comments, attrs])
  }

  return commentsByTarget
}

const buildPluginState = (doc: ManuscriptNode) => {
  const commentsByTarget = findComments(doc)
  const ranges = findCommentRanges(doc)

  const decorations: Decoration[] = []
  const nodeDecorations = new Map<string, Decoration>()
  const commentByID = new Map<string, Comment>()
  const commentIDs = new Map<string, string>()

  doc.descendants((node, pos) => {
    const id = node.attrs.id
    const comments = commentsByTarget.get(id)
    if (!comments || !comments.length) {
      return
    }

    const nodeComments: NodeComment[] = []
    const highlightComments: InlineComment[] = []
    const pointComments: InlineComment[] = []

    for (const attrs of comments) {
      const id = attrs.id
      const range = ranges.get(id)
      const comment = {
        attrs,
        range,
      }
      commentByID.set(id, comment)
      if (!comment.range) {
        nodeComments.push(comment)
      } else if (comment.range.size) {
        highlightComments.push(comment as InlineComment)
      } else {
        pointComments.push(comment as InlineComment)
      }
    }
    for (const comment of highlightComments) {
      const id = getCommentID(comment)
      commentIDs.set(comment.attrs.id, id)
      decorations.push(highlight(id, comment.range))
    }
    for (const comment of pointComments) {
      const id = getCommentID(comment)
      commentIDs.set(comment.attrs.id, id)
      //todo handle multiple point comments at the same pos
      const toDOM = () => getMarkerDOM(id, node, true)
      decorations.push(commentIcon(id, comment.range.pos, toDOM, id))
    }
    //node comments
    if (nodeComments.length) {
      const id = getCommentIDForNode(node.attrs.id)
      const count = nodeComments.length
      const key = `${id}-${count}`
      nodeComments.forEach((c) => commentIDs.set(c.attrs.id, id))
      const toDOM = () => getMarkerDOM(id, node, node.isAtom, count)
      const decoration = commentIcon(id, getDecorationPos(node, pos), toDOM, key)
      decorations.push(decoration)
      nodeDecorations.set(node.attrs.id, decoration)
    }
  })

  return {
    decorations: DecorationSet.create(doc, decorations),
    nodeDecorations,
    comments: commentByID,
    commentIDs,
  }
}

const getDecorationPos = (node: ManuscriptNode, pos: number) => {
  switch (node.type) {
    case schema.nodes.keywords:
      return pos + 2
    default:
      return pos + 1
  }
}

const highlight = (id: string, range: CommentRange) => {
  return Decoration.inline(range.pos, range.pos + range.size, {
    nodeName: 'span',
    class: 'highlight',
    id: getCommentMarkerID(id),
  }, {
    id,
  })
}

const commentIcon = (id: string, pos: number, toDOM: any, key: string) => {
  return Decoration.widget(pos, toDOM, {
    id,
    key,
    toDOM,
  })
}

export const getMarkerDOM = (
  id: string,
  target: ManuscriptNode,
  isInline: boolean,
  count = 1
) => {
  const element = document.createElement(isInline ? 'span' : 'div')
  element.id = getCommentMarkerID(id)

  const classNames = ['block-comment-button']
  switch (target.type) {
    case schema.nodes.section:
    case schema.nodes.footnotes_section:
    case schema.nodes.bibliography_section:
      classNames.push('block-comment')
      break
    case schema.nodes.figure_element:
      classNames.push('figure-comment')
      break
    case schema.nodes.bibliography_item:
      classNames.push('bibliography-comment')
      break
    default:
      classNames.push('inline-comment')
  }

  if (isInline) {
    classNames.push('point-comment')
  }

  element.classList.add(...classNames)

  let html = `
      <svg class="comment-icon" width="16" height="13" viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.0625 2.9375V7.3125L1.4375 11.6875H12.8125C13.7794 11.6875 14.5625 10.9044 14.5625 9.9375V2.9375C14.5625 1.97062 13.7794 1.1875 12.8125 1.1875H5.8125C4.84562 1.1875 4.0625 1.97062 4.0625 2.9375Z"
                fill="#FFFCDB" stroke="#FFBD26" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6.6875 4.6875H11.9375" stroke="#FFBD26" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6.6875 8.1875H9.3125" stroke="#FFBD26" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `

  if (count > 1) {
    html += ` <svg class="group-comment-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="12" height="12" rx="6" fill="#F7B314"></rect>
          <text x="6" y="8" fill="#FFF" font-size="9px" text-anchor="middle" font-weight="400">${count}</text>
      </svg>`
  }
  element.innerHTML = html
  return element
}
