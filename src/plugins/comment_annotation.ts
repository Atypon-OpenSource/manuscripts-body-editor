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
import { CommentAnnotation, Model, ObjectTypes } from '@manuscripts/json-schema'
import { getModelsByType, ManuscriptNode, schema } from '@manuscripts/transform'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { SET_COMMENT_TARGET } from './highlight'

export const commentAnnotation = new PluginKey<CommentAnnotationState>(
  'comment_annotation'
)

interface CommentAnnotationProps {
  setCommentTarget: (target?: string) => void
  modelMap: Map<string, Model>
}

type CommentAnnotationState = {
  comments: CommentAnnotation[]
  decorations: DecorationSet
}

/**
 * This plugin creates a icon decoration for both inline and block comment.
 */
export default (props: CommentAnnotationProps) => {
  return new Plugin<CommentAnnotationState>({
    key: commentAnnotation,
    state: {
      init: (config) =>
        commentsState(props.modelMap, config.doc as ManuscriptNode),
      apply: (tr) => {
        const meta = tr.getMeta(commentAnnotation)

        if (meta) {
          if (SET_COMMENT_TARGET in meta) {
            props.setCommentTarget(meta[SET_COMMENT_TARGET])
          }
        }

        return commentsState(props.modelMap, tr.doc)
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = commentAnnotation.getState(state)
        if (pluginState) {
          return pluginState.decorations
        }
      },
    },
  })
}

const commentsState = (
  modelMap: Map<string, Model>,
  doc: ManuscriptNode
): CommentAnnotationState => {
  const comments = getModelsByType<CommentAnnotation>(
    modelMap,
    ObjectTypes.CommentAnnotation
  )
  const commentsMap = new Map()
  comments.map((comment) => {
    if (!comment.target.includes('MPHighlight')) {
      commentsMap.set(
        comment.target,
        (commentsMap.get(comment.target) || 0) + 1
      )
    }
  })

  const decorations: Decoration[] = []

  doc.descendants((node, pos) => {
    const commentCount =
      commentsMap.get(node.attrs['id']) || commentsMap.get(node.attrs['rid'])
    if (commentCount) {
      decorations.push(
        Decoration.widget(pos + 1, getCommentIcon(commentCount, node))
      )
    }
  })

  return { comments, decorations: DecorationSet.create(doc, decorations) }
}

const getCommentIcon = (commentCount: number, node: ManuscriptNode) => () => {
  const { type, attrs } = node
  const element = document.createElement('div')
  const isSection =
    type === schema.nodes.section ||
    type === type.schema.nodes.footnotes_section ||
    type === type.schema.nodes.bibliography_section
  const elementClass = isSection
    ? 'block_comment'
    : type === schema.nodes.figure_element
    ? 'figure_comment'
    : 'inline_comment'

  if (type === schema.nodes.citation) {
    element.id = attrs['rid']
    element.classList.add('inline_citation')
  }

  element.classList.add('block_comment_button', elementClass)

  const groupCommentIcon =
    (commentCount > 1 &&
      ` <svg class="group_comment_icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="12" height="12" rx="6" fill="#F7B314"></rect>
          <text x="6" y="8" fill="#FFF" font-size="9px" text-anchor="middle" font-weight="400">${commentCount}</text>
      </svg>`) ||
    ''

  element.innerHTML = `
      <svg class="comment_icon" width="16" height="13" viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.0625 2.9375V7.3125L1.4375 11.6875H12.8125C13.7794 11.6875 14.5625 10.9044 14.5625 9.9375V2.9375C14.5625 1.97062 13.7794 1.1875 12.8125 1.1875H5.8125C4.84562 1.1875 4.0625 1.97062 4.0625 2.9375Z"
                fill="#FFFCDB" stroke="#FFBD26" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6.6875 4.6875H11.9375" stroke="#FFBD26" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6.6875 8.1875H9.3125" stroke="#FFBD26" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${groupCommentIcon}
  `
  return element
}
