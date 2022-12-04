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

import { CitationProvider } from '@manuscripts/library'
import {
  Build,
  ManuscriptSchema,
  schema,
} from '@manuscripts/manuscript-transform'
import { BibliographyItem, Model } from '@manuscripts/manuscripts-json-schema'
import { Capabilities } from '@manuscripts/style-guide'
import { EditorState, Plugin } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React from 'react'

import { transformPasted } from '../../lib/paste'
import { CreateView } from '../../useEditor'
import plugins from './editor-plugins-lw'
import views from './editor-views-lw'
import { ViewerProps } from './ManuscriptsViewer'

export interface EditorProps extends ViewerProps {
  plugins?: Array<Plugin<ManuscriptSchema>>
  getCitationProvider: () => CitationProvider | undefined
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  deleteModel: (id: string) => Promise<string>
  setLibraryItem: (item: BibliographyItem) => void
  matchLibraryItemByIdentifier: (
    item: BibliographyItem
  ) => BibliographyItem | undefined
  filterLibraryItems: (query: string) => Promise<BibliographyItem[]>
  removeLibraryItem: (id: string) => void
  setCommentTarget: (commentTarget?: string) => void
  setSelectedComment: (id?: string) => void
  retrySync: (componentIDs: string[]) => Promise<void>

  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
  environment?: string
  submissionId: string
  updateDesignation: (designation: string, name: string) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  uploadAttachment: (designation: string, file: File) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  capabilities?: Capabilities
  jupyterConfig: {
    url: string
    token: string
    disabled: boolean
  }
}

export default {
  createState: (props: EditorProps) => {
    return EditorState.create<ManuscriptSchema>({
      doc: props.doc,
      schema,
      plugins: plugins(props),
    })
  },

  createView: (props: EditorProps): CreateView => (el, state, dispatch) =>
    new EditorView(el, {
      state,
      editable: () => props.permissions.write,
      scrollMargin: {
        top: 100,
        bottom: 100,
        left: 0,
        right: 0,
      },
      dispatchTransaction: dispatch,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nodeViews: views(props, dispatch) as any,
      attributes: props.attributes,
      transformPasted,
    }),
}
