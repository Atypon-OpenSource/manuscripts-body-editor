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
import { ManuscriptEditorState } from '@manuscripts/manuscript-transform'
import { Color } from '@manuscripts/manuscripts-json-schema'
import { Transaction } from 'prosemirror-state'

export enum DialogNames {
  TableOptions = 'TableOptions',
  TableCellOptions = 'TableCellOptions',
  TableCellBorderOptions = 'TableCellBorderOptions',
}

export interface Props {
  handleCloseDialog: () => void
  currentDialog?: DialogNames | null
  editorState: ManuscriptEditorState
  dispatch: (tr: Transaction) => void
  colors: Color[]
  handleAddColor: (hexCode: string) => void
}
