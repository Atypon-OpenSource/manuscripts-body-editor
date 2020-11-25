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
import '../lib/smooth-scroll'

import { GetCitationProcessor } from '@manuscripts/library'
import {
  Build,
  ManuscriptEditorView,
  ManuscriptSchema,
  schema,
} from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Model,
  // Section,
} from '@manuscripts/manuscripts-json-schema'
import { RxAttachment, RxAttachmentCreator } from '@manuscripts/rxdb'
import { EditorState, Plugin } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React from 'react'

import { transformPasted } from '../lib/paste'
import plugins from '../plugins/editor'
import { ChangeReceiver } from '../types'
import { CreateView } from '../useEditor'
import views from '../views/editor'
import { ViewerProps } from './ManuscriptsViewer'

export interface EditorProps extends ViewerProps {
  plugins?: Array<Plugin<ManuscriptSchema>>
  getCitationProcessor: GetCitationProcessor
  putAttachment: (
    id: string,
    attachment: RxAttachmentCreator
  ) => Promise<RxAttachment<Model>>
  removeAttachment: (id: string, attachmentID: string) => Promise<void>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  deleteModel: (id: string) => Promise<string>
  setLibraryItem: (item: BibliographyItem) => void
  matchLibraryItemByIdentifier: (
    item: BibliographyItem
  ) => BibliographyItem | undefined
  filterLibraryItems: (query: string) => Promise<BibliographyItem[]>
  subscribe: (receive: ChangeReceiver) => void
  setView: (view: ManuscriptEditorView) => void
  retrySync: (componentIDs: string[]) => Promise<void>
  setCommentTarget: (commentTarget?: string) => void
  jupyterConfig: {
    url: string
    token: string
  }
  permissions: {
    write: boolean
  }
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
  environment?: string
}

export default {
  createState: (props: EditorProps) =>
    EditorState.create<ManuscriptSchema>({
      doc: props.doc,
      schema,
      plugins: plugins(props),
    }),

  createView: (props: EditorProps): CreateView => (el, state, dispatch) =>
    new EditorView(el, {
      state,
      editable: () => props.permissions.write,
      scrollThreshold: 100,
      scrollMargin: {
        top: 100,
        bottom: 100,
        left: 0,
        right: 0,
      },
      dispatchTransaction: dispatch,
      nodeViews: views(props),
      attributes: props.attributes,
      transformPasted,
    }),
}
