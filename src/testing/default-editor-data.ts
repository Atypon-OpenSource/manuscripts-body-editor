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

import {
  BibliographyItem,
  Manuscript,
  Model,
  UserProfile,
} from '@manuscripts/json-schema'
import { getAllPermitted } from '@manuscripts/style-guide'
import {
  ActualManuscriptNode,
  Build,
  ManuscriptEditorView,
  schema,
} from '@manuscripts/transform'
import { createBrowserHistory } from 'history'
import { uniqueId } from 'lodash'
import { ReactElement, ReactNode } from 'react'
import ReactDOM from 'react-dom'
import { DefaultTheme } from 'styled-components'

import { EditorProps } from '../configs/lean-workflow/ManuscriptsEditor'
import { ViewerProps } from '../configs/lean-workflow/ManuscriptsViewer'
import { PopperManager } from '../lib/popper'
import emptyEditorDocJson from './empty-editor-doc.json'

type TestData = {
  MANUSCRIPT: Manuscript
  MODEL: Model
  USER: UserProfile
  DOC: ActualManuscriptNode
  MODEL_MAP: Map<string, Model>
}

const theme: DefaultTheme = {}

export const TEST_DATA: TestData = {
  MANUSCRIPT: {
    containerID: 'test-manuscript-1-containerID',
    _id: 'test-manuscript-1-id',
    objectType: 'MPManuscript',
    createdAt: 1618400000,
    updatedAt: 1618407000,
  },
  MODEL: {
    _id: 'test-model-1-id',
    objectType: 'MPSection',
    createdAt: 1618400000,
    updatedAt: 1618407000,
    prototype: 'test-model-1-prototype',
  },
  USER: {
    _id: 'test-user-profile-1-id',
    objectType: 'MPUserProfile',
    createdAt: 1618400000,
    updatedAt: 1618407000,
    bibliographicName: {
      _id: 'test-user-profile-bibliographicName-1',
      objectType: 'MPBibliographicName',
    },
    userID: 'test-user-profile-1-user-id',
  },
  DOC: schema.nodeFromJSON(emptyEditorDocJson) as ActualManuscriptNode,
  MODEL_MAP: new Map<string, Model>(),
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const defaultViewerProps: ViewerProps = {
  attributes: {
    class: 'manuscript-editor',
    dir: 'ltr',
    lang: 'en-GB',
    spellcheck: 'true',
    tabindex: '2',
  },
  doc: TEST_DATA.DOC,
  getModel: <T extends Model>(id: string) => {
    return TEST_DATA.MODEL_MAP.get(id) as T | undefined
  },
  getManuscript: () => TEST_DATA.MANUSCRIPT,
  getLibraryItem: (_id: string) => undefined,
  locale: 'en-GB',
  modelMap: new Map<string, Model>(),
  popper: new PopperManager(),
  projectID: 'test-project-id',
  getCurrentUser: () => TEST_DATA.USER,
  history: createBrowserHistory(),
  renderReactComponent: (child: ReactNode, container: HTMLElement) => {
    ReactDOM.render(child as ReactElement, container)
  },
  unmountReactComponent: ReactDOM.unmountComponentAtNode,
  components: {},
  theme,
  submissionId: 'test-submission-id',
  updateDesignation: async () => undefined,
  uploadAttachment: async () => undefined,
  getAttachments: () => [],
  getCapabilities: () => getAllPermitted(),
}

export const defaultEditorProps: EditorProps = {
  ...defaultViewerProps,
  ...{
    autoFocus: undefined,
    getCitationProvider: () => undefined,
    plugins: [],
    saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => {
      const id = model._id ?? ''
      const oldModel = TEST_DATA.MODEL_MAP.get(id) ?? {}
      const updatedModel = {
        createdAt: Date.now() / 1000,
        updatedAt: Date.now() / 1000,
        _id: uniqueId(),
        ...oldModel,
        ...model,
      } as T
      TEST_DATA.MODEL_MAP.set(id, updatedModel)
      return Promise.resolve(updatedModel)
    },
    deleteModel: (id: string) => {
      TEST_DATA.MODEL_MAP.delete(id)
      return Promise.resolve(id)
    },
    getModel: <T extends Model>(id: string) => {
      return TEST_DATA.MODEL_MAP.get(id) as T | undefined
    },
    getLibraryItem: (_id: string) => undefined,
    setLibraryItem: (_item: BibliographyItem) => undefined,
    matchLibraryItemByIdentifier: (_item: BibliographyItem) => undefined,
    filterLibraryItems: (_query: string) => Promise.resolve([]),
    removeLibraryItem: () => undefined,
    removeAttachment: (_id: string, _attachmentID: string) => Promise.resolve(),
    subscribe: () => undefined,
    setView: () => undefined,
    retrySync: (_componentIDs: string[]) => Promise.resolve(),
    handleStateChange: (_view: ManuscriptEditorView, _docChanged: boolean) =>
      undefined,
    setComment: () => undefined,
    setSelectedComment: () => undefined,
    components: {},
    environment: undefined,
  },
}
