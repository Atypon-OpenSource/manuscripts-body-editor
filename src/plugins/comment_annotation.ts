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
import { CommentAnnotation } from '@manuscripts/json-schema'
import { CommentNode, ManuscriptNode, schema } from '@manuscripts/transform'
import { Node as ProsemirrorNode, NodeType } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { SET_COMMENT } from './highlight'

export const commentAnnotation = new PluginKey<DecorationSet>(
  'comment_annotation'
)

export const commentScroll = (
  id: string,
  direction: 'editor' | 'inspector',
  isHighlight?: boolean
) => {
  const elementClass = isHighlight ? 'highlight-marker' : 'ProseMirror-widget'
  const commentIcon = document.querySelector(`[id="${id}"].${elementClass}`)
  const commentCard = document.querySelectorAll(`.comments-group [id="${id}"]`)

  if (commentIcon && commentCard.length > 0) {
    const element = direction === 'editor' ? commentIcon : commentCard.item(0)

    document
      .querySelectorAll(`.selected-comment`)
      .forEach((element) => element.classList.remove('selected-comment'))
    commentIcon.classList.add('selected-comment')
    commentCard.forEach((node) => node.classList.add('selected-comment'))
    element?.scrollIntoView({
      behavior: 'auto',
      block: 'start',
      inline: 'start',
    })
  }
}

export const isThereSelector = (selector: unknown) =>
  !!(selector && Object.keys(selector).length)

export const isHighlightComment = (
  comment: Pick<CommentAnnotation, 'selector'>
) =>
  comment.selector &&
  isThereSelector(comment.selector) &&
  comment.selector.from !== comment.selector.to

interface CommentAnnotationProps {
  setComment: (comment?: CommentAnnotation) => void
  setSelectedComment: (id?: string) => void
}

type Comment = {
  id: string
  target: string
  location: 'block' | 'point'
  count: number
  targetType: NodeType
}

/**
 * This plugin creates a icon decoration for both inline and block comment.
 */
export default (props: CommentAnnotationProps) => {
  return new Plugin<DecorationSet>({
    key: commentAnnotation,
    state: {
      init: (tr) => {
        if (tr.doc) {
          return commentsState(props.setSelectedComment, tr.doc)
        } else {
          return new DecorationSet()
        }
      },
      apply: (tr) => {
        const meta = tr.getMeta(commentAnnotation)

        if (meta) {
          if (SET_COMMENT in meta) {
            props.setComment(meta[SET_COMMENT])
          }
        }

        return commentsState(props.setSelectedComment, tr.doc)
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = commentAnnotation.getState(state)
        if (pluginState) {
          return pluginState
        }
      },
    },
  })
}

const getNodePosition = (node: ProsemirrorNode, pos: number) => {
  switch (node.type) {
    case schema.nodes.keywords:
      return pos + 2
    default:
      return pos + 1
  }
}

const commentsState = (
  setSelectedComment: (id?: string) => void,
  doc: ManuscriptNode
): DecorationSet => {
  const comments: CommentNode['attrs'][] = []
  doc.descendants((node) => {
    if (node.type === schema.nodes.comments) {
      node.descendants((comment) => {
        comments.push(comment.attrs as CommentNode['attrs'])
      })
      return false
    }
  })

  const commentsMap = comments.reduce((map, { id, target, selector }) => {
    if (!isHighlightComment({ selector })) {
      const commentId = isThereSelector(selector) ? id : target
      map.set(commentId, {
        id,
        target,
        location: isThereSelector(selector) ? 'point' : 'block',
        count: (map.get(commentId)?.count || 0) + 1,
      })
    }
    return map
  }, new Map<string, Omit<Partial<Comment>, 'targetType'>>())

  const decorations: Decoration[] = []

  doc.descendants((node, pos) => {
    const id = node.attrs['id'] || node.attrs['rid']
    const targetComment = commentsMap.get(id)
    if (targetComment) {
      const position = getNodePosition(node, pos)

      decorations.push(
        Decoration.widget(
          position,
          getCommentIcon(
            { ...targetComment, targetType: node.type } as Comment,
            setSelectedComment
          ),
          { key: targetComment.id }
        )
      )
    }
  })

  return DecorationSet.create(doc, decorations)
}

const getCommentIcon =
  (comment: Comment, setSelectedComment: (id?: string) => void) => () => {
    const { id, targetType, target, count, location } = comment
    const commentId = location === 'block' ? target : id
    const element = document.createElement('div')
    element.id = commentId

    let elementClass
    switch (targetType) {
      case schema.nodes.section:
      case schema.nodes.footnotes_section:
      case schema.nodes.bibliography_section:
        elementClass = 'block-comment'
        break
      case schema.nodes.figure_element:
        elementClass = 'figure-comment'
        break
      case schema.nodes.bibliography_item:
        elementClass = 'bibliography-comment'
        break
      default:
        elementClass = 'inline-comment'
    }

    if (targetType === schema.nodes.citation || location === 'point') {
      element.classList.add(
        location === 'point' ? 'point-comment' : 'inline-citation'
      )
    }

    element.classList.add('block-comment-button', elementClass)

    element.onclick = (e: Event) => {
      e.stopPropagation()
      setSelectedComment(commentId)
      commentScroll(commentId, 'inspector')
    }

    const groupCommentIcon =
      (count > 1 &&
        ` <svg class="group-comment-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="12" height="12" rx="6" fill="#F7B314"></rect>
          <text x="6" y="8" fill="#FFF" font-size="9px" text-anchor="middle" font-weight="400">${count}</text>
      </svg>`) ||
      ''

    element.innerHTML = `
      <svg class="comment-icon" width="16" height="13" viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.0625 2.9375V7.3125L1.4375 11.6875H12.8125C13.7794 11.6875 14.5625 10.9044 14.5625 9.9375V2.9375C14.5625 1.97062 13.7794 1.1875 12.8125 1.1875H5.8125C4.84562 1.1875 4.0625 1.97062 4.0625 2.9375Z"
                fill="#FFFCDB" stroke="#FFBD26" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6.6875 4.6875H11.9375" stroke="#FFBD26" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6.6875 8.1875H9.3125" stroke="#FFBD26" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${groupCommentIcon}
  `
    return element
  }
