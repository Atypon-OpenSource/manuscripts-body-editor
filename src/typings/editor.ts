/*!
 * © 2021 Atypon Systems LLC
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
import { CitationProvider } from '@manuscripts/library'
import {
  Build,
  ManuscriptEditorView,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Model,
  // Section,
} from '@manuscripts/manuscripts-json-schema'
import { RxAttachment, RxAttachmentCreator } from '@manuscripts/rxdb'
import { Capabilities } from '@manuscripts/style-guide'
import { EditorState, Plugin, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import { ViewerProps } from '../components/Viewer'
import { EditorProviders } from '../context/Providers'
import type { CreateExtension } from './extension'
import { ChangeReceiver } from './utils'

export interface EditorProps extends ViewerProps {
  autoFocus?: boolean
  getCitationProvider: () => CitationProvider | undefined
  plugins: Array<Plugin<ManuscriptSchema>>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  putAttachment: (
    id: string,
    attachment: RxAttachmentCreator
  ) => Promise<RxAttachment<Model>>
  removeAttachment: (id: string, attachmentID: string) => Promise<void>
  deleteModel: (id: string) => Promise<string>
  setLibraryItem: (item: BibliographyItem) => void
  matchLibraryItemByIdentifier: (
    item: BibliographyItem
  ) => BibliographyItem | undefined
  filterLibraryItems: (query: string) => Promise<BibliographyItem[]>
  subscribe: (receive: ChangeReceiver) => void
  setView: (view: ManuscriptEditorView) => void
  retrySync: (componentIDs: string[]) => Promise<void>
  handleStateChange: (view: ManuscriptEditorView, docChanged: boolean) => void
  setCommentTarget: (commentTarget?: string) => void
  jupyterConfig: {
    url: string
    token: string
  }
  permissions: {
    write: boolean
  }
  capabilites?: Capabilities
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
  environment?: string
}

export interface UseEditorProps {
  className?: string
  initialState?: EditorState
  initialDoc?: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  manuscriptsProps: EditorProps
  extensions: CreateExtension[]
  ctx: EditorProviders
  onEditorReady?: (providers: EditorProviders) => void
  onEdit?: (state: EditorState) => void
}

export type Commands = { [name: string]: (...args: any[]) => Command }
export type CommandDispatch = (tr: Transaction) => void
export type Command = (
  state: EditorState,
  dispatch?: CommandDispatch,
  view?: EditorView
) => boolean
export type HigherOrderCommand = (command: Command) => Command

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface JSONEditorState {
  doc: { [key: string]: any }
  selection: { [key: string]: any }
  plugins: { [key: string]: any }
}
export type JSONPMNode = { [key: string]: any }
/* eslint-enable */
