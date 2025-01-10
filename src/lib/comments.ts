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
  ManuscriptNode,
} from '@manuscripts/transform'
import { NodeWithPos } from 'prosemirror-utils'
import { EditorView } from 'prosemirror-view'

import { addNodeComment } from '../commands'
import { commentsKey, setCommentSelection } from '../plugins/comments'

export type CommentAttrs = CommentNode['attrs']
export type HighlightMarkerAttrs = HighlightMarkerNode['attrs']

export type Comment = NodeComment | InlineComment

export type NodeComment = {
  key: CommentKey
  node: CommentNode
  pos: number
  target: NodeWithPos
}

export type InlineComment = {
  key: CommentKey
  node: CommentNode
  pos: number
  target: NodeWithPos
  range: CommentRange
}

export type CommentRange = {
  pos: number
  size: number
}

export type CommentKey = string

export type CommentSelection = {
  key: CommentKey
  id: string
  isNew: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNodeComment = (c: any): c is NodeComment => !c.range

export const isReply = (comment: Comment) => {
  return comment.node.attrs.target.includes('MPCommentAnnotation')
}

export const getCommentKey = (
  comment: CommentAttrs,
  range: CommentRange | undefined,
  target: ManuscriptNode
): CommentKey => {
  if (!range) {
    return target.attrs.id
  } else if (!range.size) {
    return `${target.attrs.id}-${range.pos}`
  } else {
    return comment.id
  }
}

export const getCommentRange = (comment: CommentAttrs) => {
  if (!comment.selector) {
    return
  }
  return {
    pos: comment.selector.from,
    size: comment.selector.to - comment.selector.from,
  }
}

export const handleComment = (node: ManuscriptNode, view: EditorView): void => {
  const { state } = view

  addNodeComment(node, state, view.dispatch)
}

export const createCommentMarker = (
  tagName: string,
  key: CommentKey,
  count?: number
) => {
  const element = document.createElement(tagName)
  element.id = getMarkerID(key)
  element.dataset.key = key
  element.classList.add('comment-marker')

  if (count && count > 1) {
    element.dataset.count = String(count)
  }

  element.innerHTML = `
<svg width="16" height="13" viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.0625 2.9375V7.3125L1.4375 11.6875H12.8125C13.7794 11.6875 14.5625 10.9044 14.5625 9.9375V2.9375C14.5625 1.97062 13.7794 1.1875 12.8125 1.1875H5.8125C4.84562 1.1875 4.0625 1.97062 4.0625 2.9375Z"
          fill="#FFFCDB" stroke="#FFBD26" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6.6875 4.6875H11.9375" stroke="#FFBD26" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6.6875 8.1875H9.3125" stroke="#FFBD26" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
    `
  return element
}

const getMarkerID = (id: string) => {
  return `${id}-comment-marker`
}

export const handleCommentMarkerClick = (event: Event, view: EditorView) => {
  const element = event.target as HTMLElement
  // Handle click on comment marker
  const marker = element.closest('.comment-marker') as HTMLElement
  if (marker) {
    const key = marker.dataset.key as CommentKey
    const tr = view.state.tr
    setCommentSelection(tr, key, undefined, false)
    view.dispatch(tr)
    return
  }
}
export const updateCommentSelection = (
  marker: HTMLElement,
  view: EditorView
) => {
  const key = marker.dataset.key as CommentKey
  const com = commentsKey.getState(view.state)

  const comments = com?.commentsByKey.get(key)
  if (!comments) {
    marker.setAttribute('data-count', '0')
  } else if (comments.length !== 1) {
    marker.setAttribute('data-count', String(comments.length))
  } else {
    marker.removeAttribute('data-count')
  }

  const isSelected = key === com?.selection?.key
  if (isSelected) {
    marker.classList.add('selected-comment')
  } else {
    marker.classList.remove('selected-comment')
  }

  return isSelected
}
