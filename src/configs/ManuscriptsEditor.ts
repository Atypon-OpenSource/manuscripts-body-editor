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
  CommentAnnotation,
  Model,
} from '@manuscripts/json-schema'
import { CitationProvider } from '@manuscripts/library'
import { Capabilities } from '@manuscripts/style-guide'
import { Build, schema } from '@manuscripts/transform'
import { EditorState, Plugin } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React from 'react'

import { transformPasted } from '../lib/paste'
import { CreateView, CollabProvider } from '../useEditor'
import plugins from './editor-plugins'
import views from './editor-views'
import { ViewerProps } from './ManuscriptsViewer'

export type CSLProps = {
  style?: string
  locale?: string
}

export interface EditorProps extends ViewerProps {
  plugins?: Plugin[]
  getCitationProvider: () => CitationProvider | undefined
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  deleteModel: (id: string) => Promise<string>
  setLibraryItem: (item: BibliographyItem) => void
  matchLibraryItemByIdentifier: (
    item: BibliographyItem
  ) => BibliographyItem | undefined
  filterLibraryItems: (query: string) => Promise<BibliographyItem[]>
  removeLibraryItem: (id: string) => void
  setComment: (comment?: CommentAnnotation) => void
  setSelectedComment: (id?: string) => void
  retrySync: (componentIDs: string[]) => Promise<void>

  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
  environment?: string
  uploadAttachment: (file: File) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  getCapabilities: () => Capabilities
  cslProps: CSLProps
  collabProvider?: CollabProvider
}

export default {
  createState: (props: EditorProps) => {
    return EditorState.create({
      doc: props.doc,
      schema,
      plugins: plugins(props),
    })
  },

  createView:
    (props: EditorProps): CreateView =>
    (el, state, dispatch) =>
      new EditorView(el, {
        state,
        editable: () => props.getCapabilities().editArticle,
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
