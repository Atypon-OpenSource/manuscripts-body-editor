/*!
 * © 2025 Atypon Systems LLC
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

export type Capabilities = {
  /* track changes */
  handleSuggestion: boolean
  editWithoutTracking: boolean
  rejectOwnSuggestion: boolean

  /* comments */
  handleOwnComments: boolean
  resolveOwnComment: boolean
  handleOthersComments: boolean
  resolveOthersComment: boolean
  createComment: boolean

  /* file handling */
  downloadFiles: boolean
  changeDesignation: boolean
  moveFile: boolean
  replaceFile: boolean
  uploadFile: boolean
  detachFile: boolean
  setMainManuscript: boolean

  /* editor */
  formatArticle: boolean
  editArticle: boolean
  editMetadata: boolean
  editCitationsAndRefs: boolean
  seeEditorToolbar: boolean
  seeReferencesButtons: boolean
}

export enum Actions {
  // proceed = 'proceed',
  updateAttachment = 'update-attachment',
  updateDueDate = 'update-due-date',
  addNote = 'add-note',
  setMainManuscript = 'set-main-manuscript',
  editWithoutTracking = 'edit-without-tracking',
}
