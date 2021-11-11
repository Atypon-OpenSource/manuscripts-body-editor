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
import '../../lib/smooth-scroll'

import {
  ManuscriptNode,
  ManuscriptSchema,
  schema,
} from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Manuscript,
  Model,
  UserProfile,
} from '@manuscripts/manuscripts-json-schema'
import { History } from 'history'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React from 'react'
import { DefaultTheme } from 'styled-components'

import { PopperManager } from '../../lib/popper'
import { CreateView } from '../../useEditor'
import plugins from './viewer-plugins-lw'
import views from './viewer-views-lw'

export interface ViewerProps {
  attributes?: { [key: string]: string }
  doc: ManuscriptNode
  getModel: <T extends Model>(id: string) => T | undefined
  getManuscript: () => Manuscript
  getLibraryItem: (id: string) => BibliographyItem | undefined
  permissions: {
    write: boolean
  }
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
  submissionId: string
  updateDesignation: (designation: string, name: string) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  uploadAttachment: (designation: string, file: File) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default {
  createState: (props: ViewerProps) => {
    return EditorState.create<ManuscriptSchema>({
      doc: props.doc,
      schema,
      plugins: plugins(props),
    })
  },

  createView:
    (props: ViewerProps): CreateView =>
    (el, state, dispatch) =>
      new EditorView<ManuscriptSchema>(el, {
        editable: () => false,
        state,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodeViews: views(props, dispatch) as any,
        dispatchTransaction: dispatch,
        attributes: props.attributes,
      }),
}
