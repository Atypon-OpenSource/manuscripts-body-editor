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
  ActualManuscriptNode,
  schema,
  SectionCategory,
} from '@manuscripts/transform'
import { createBrowserHistory } from 'history'

import { EditorProps } from '../configs/ManuscriptsEditor'
import { PopperManager } from '../lib/popper'
import { defaultCapabilities } from './default-capabilities'
import emptyEditorDocJson from './empty-editor-doc.json'
import sectionCategories from './section-categories.json'

export const defaultEditorProps: EditorProps = {
  attributes: {
    class: 'manuscript-editor',
    dir: 'ltr',
    lang: 'en-GB',
    spellcheck: 'true',
    tabindex: '2',
  },
  doc: schema.nodeFromJSON(emptyEditorDocJson) as ActualManuscriptNode,
  locale: 'en-GB',
  popper: new PopperManager(),
  projectID: 'test-project-id',
  getCurrentUser: () => ({
    _id: 'test-user-profile-1-id',
    userID: '',
  }),
  // @ts-ignore
  history: createBrowserHistory(),
  theme: {},
  getFiles: () => [],
  fileManagement: {
    // @ts-ignore
    upload: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
    download: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
  },
  getCapabilities: () => ({
    ...defaultCapabilities,
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
