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
  CommentAnnotation,
  Manuscript,
  Model,
  UserProfile,
} from '@manuscripts/json-schema'
import {
  Capabilities,
  FileAttachment,
  FileManagement,
} from '@manuscripts/style-guide'
import { ManuscriptNode, schema } from '@manuscripts/transform'
import { History } from 'history'
import { EditorState, Plugin } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React from 'react'
import { DefaultTheme } from 'styled-components'

import { CollabProvider } from '../classes/collabProvider'
import { Dispatch } from '../commands'
import { transformPasted } from '../lib/paste'
import { PopperManager } from '../lib/popper'
import plugins from './editor-plugins'
import views from './editor-views'

export type CSLProps = {
  style?: string
  locale?: string
}

export interface EditorProps {
  attributes?: { [key: string]: string }
  locale: string
  theme: DefaultTheme
  plugins?: Plugin[]
  getCurrentUser: () => UserProfile

  projectID: string
  doc: ManuscriptNode
  getModelMap: () => Map<string, Model>
  getManuscript: () => Manuscript
  getFiles: () => FileAttachment[]
  fileManagement: FileManagement

  popper: PopperManager
  history: History

  renderReactComponent: (child: React.ReactNode, container: HTMLElement) => void
  unmountReactComponent: (container: HTMLElement) => void
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any

  getCapabilities: () => Capabilities
  cslProps: CSLProps

  setComment: (comment?: CommentAnnotation) => void
  setSelectedComment: (id?: string) => void
  setEditorSelectedSuggestion: (id?: string) => void
  retrySync: (componentIDs: string[]) => Promise<void>
  environment?: string
  collabProvider?: CollabProvider
}

export const createEditorState = (props: EditorProps) =>
  EditorState.create({
    doc: props.doc,
    schema,
    plugins: plugins(props),
  })

export const createEditorView = (
  props: EditorProps,
  root: HTMLElement,
  state: EditorState,
  dispatch: Dispatch
) =>
  new EditorView(root, {
    state,
    editable: () => props.getCapabilities().editArticle,
    scrollMargin: {
      top: 100,
      bottom: 100,
      left: 0,
      right: 0,
    },
    dispatchTransaction: dispatch,
    nodeViews: views(props, dispatch),
    attributes: props.attributes,
    transformPasted,
  })
