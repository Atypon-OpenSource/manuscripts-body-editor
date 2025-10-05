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

import { getAllPermitted } from '@manuscripts/style-guide'
import {
  ActualManuscriptNode,
  schema,
  SectionCategory,
  UserProfile,
} from '@manuscripts/transform'
import { createBrowserHistory } from 'history'
import { DefaultTheme } from 'styled-components'

import { EditorProps } from '../configs/ManuscriptsEditor'
import { PopperManager } from '../lib/popper'
import emptyEditorDocJson from './empty-editor-doc.json'
import sectionCategories from './section-categories.json'
type TestData = {
  MANUSCRIPT: any // eslint-disable-line @typescript-eslint/no-explicit-any
  MODEL: any // eslint-disable-line @typescript-eslint/no-explicit-any
  USER: UserProfile
  DOC: ActualManuscriptNode
  MODEL_MAP: Map<string, any>
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
    bibliographicName: {
      _id: 'test-user-profile-bibliographicName-1',
    },
    userID: 'test-user-profile-1-user-id',
  },
  DOC: schema.nodeFromJSON(emptyEditorDocJson) as ActualManuscriptNode,
  MODEL_MAP: new Map<string, any>(), // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const defaultEditorProps: EditorProps = {
  attributes: {
    class: 'manuscript-editor',
    dir: 'ltr',
    lang: 'en-GB',
    spellcheck: 'true',
    tabindex: '2',
  },
  doc: TEST_DATA.DOC,
  locale: 'en-GB',
  popper: new PopperManager(),
  projectID: 'test-project-id',
  getCurrentUser: () => TEST_DATA.USER,
  // @ts-ignore
  history: createBrowserHistory(),
  theme,
  getFiles: () => [],
  fileManagement: {
    // @ts-ignore
    upload: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
    download: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
  },
  getCapabilities: () => ({
    ...getAllPermitted(),
    editWithoutTracking: true,
  }),
  cslProps: {
    style: '',
    locale: '',
  },
  setComment: () => undefined,
  setSelectedComment: () => undefined,
  setEditorSelectedSuggestion: () => undefined,
  sectionCategories: new Map(
    sectionCategories.map((category: SectionCategory) => [
      category.id,
      category,
    ])
  ),
}
