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
  BibliographyItem,
  Manuscript,
  Model,
  UserProfile,
} from '@manuscripts/json-schema'
import { Capabilities, FileAttachment } from '@manuscripts/style-guide'
import { ManuscriptNode, schema } from '@manuscripts/transform'
import { History } from 'history'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React from 'react'
import { DefaultTheme } from 'styled-components'

import { PopperManager } from '../lib/popper'
import { CreateView } from '../useEditor'
import plugins from './viewer-plugins'
import views from './viewer-views'

export interface ViewerProps {
  attributes?: { [key: string]: string }
  doc: ManuscriptNode
  getModel: <T extends Model>(id: string) => T | undefined
  getManuscript: () => Manuscript
  getLibraryItem: (id: string) => BibliographyItem | undefined
  locale: string
  modelMap: Map<string, Model>
  popper: PopperManager
  projectID: string
  getCurrentUser: () => UserProfile
  history: History
  renderReactComponent: (child: React.ReactNode, container: HTMLElement) => void
  unmountReactComponent: (container: HTMLElement) => void
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
  theme: DefaultTheme
  uploadAttachment: (file: File) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  getAttachments: () => FileAttachment[]
  getCapabilities: () => Capabilities
  getDoc: () => ProsemirrorNode
}

export default {
  createState: (props: ViewerProps) => {
    return EditorState.create({
      doc: props.doc,
      schema,
      plugins: plugins(props),
    })
  },

  createView:
    (props: ViewerProps): CreateView =>
    (el, state, dispatch) =>
      new EditorView(el, {
        editable: () => false,
        state,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodeViews: views(props, dispatch) as any,
        dispatchTransaction: dispatch,
        attributes: props.attributes,
      }),
}
