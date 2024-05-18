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
  CommentNode,
  HighlightMarkerNode,
  ManuscriptEditorState, ManuscriptNode,
} from '@manuscripts/transform'

import {commentsKey} from '../plugins/comments'

export type CommentAttrs = CommentNode['attrs']
export type HighlightMarkerAttrs = HighlightMarkerNode['attrs']

export type Comment = NodeComment | InlineComment

export type NodeComment = {
  attrs: CommentAttrs
}

export type InlineComment = {
  attrs: CommentAttrs
  range: CommentRange
}

export type CommentRange = {
  pos: number
  size: number
}

export const isNodeComment = (comment: any): comment is InlineComment => !comment.range

export const getCommentIconForNode = (
  state: ManuscriptEditorState,
  node: ManuscriptNode
) => {
  const comments = commentsKey.getState(state)
  if (!comments) {
    return
  }
  const decoration = comments.nodeDecorations.get(node.attrs.id)
  if (!decoration) {
    return
  }
  const toDOM = decoration.spec.toDOM
  if (!toDOM) {
    return
  }
  return toDOM()
}

export const getCommentID = (comment: Comment) => {
  if (isNodeComment(comment)) {
    return `${comment.attrs.target}-comment`
  } else {
    return comment.attrs.id
  }
}

export const getCommentIDForNode = (id: string) => {
  return `${id}-comment`
}

export const getCommentMarkerID = (id: string) => {
  return `${id}-marker`
}
