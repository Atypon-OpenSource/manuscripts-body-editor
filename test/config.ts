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

import 'prosemirror-view/style/prosemirror.css'

import {
  Build,
  ManuscriptNode,
  schema,
} from '@manuscripts/manuscript-transform'
import {
  CommentAnnotation,
  Manuscript,
  Model,
} from '@manuscripts/manuscripts-json-schema'
import { Capabilities } from '@manuscripts/style-guide'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React from 'react'

import { PopperManager } from '../src'
import { transformPasted } from '../src/lib/paste'
import { CreateView } from '../src/useEditor'
import plugins from './plugins'
import views from './views'

export interface Props {
  doc: ManuscriptNode
  getModel: <T extends Model>(id: string) => T | undefined
  getManuscript: () => Manuscript
  locale: string
  modelMap: Map<string, Model>
  popper: PopperManager
  projectID: string
  renderReactComponent: (child: React.ReactNode, container: HTMLElement) => void
  unmountReactComponent: (container: HTMLElement) => void

  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  deleteModel: (id: string) => Promise<string>
  retrySync: (componentIDs: string[]) => Promise<void>
  capabilities?: Capabilities
  setCommentTarget: (commentTarget?: CommentAnnotation) => void

  getAttachment: (id: string) => Blob
  putAttachment: (file: File) => Promise<string>
}

export default {
  createState: (props: Props) =>
    EditorState.create({
      doc: props.doc,
      schema,
      plugins: plugins(props),
    }),

  createView:
    (props: Props): CreateView =>
    (el, state, dispatch) =>
      new EditorView(el, {
        state,
        editable: () => !!props.capabilities?.editArticle,
        scrollMargin: {
          top: 100,
          bottom: 100,
          left: 0,
          right: 0,
        },
        dispatchTransaction: dispatch,
        nodeViews: views(props),
        transformPasted,
      }),
}
