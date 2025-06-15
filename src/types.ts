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

import { TrackedAttrs } from '@manuscripts/track-changes-plugin'
import {
  ManuscriptEditorState,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeView,
  ManuscriptTransaction,
} from '@manuscripts/transform'
import { Decoration } from 'prosemirror-view'

export type EditorAction = (
  state: ManuscriptEditorState,
  dispatch?: (tr: ManuscriptTransaction) => void,
  view?: ManuscriptEditorView
) => boolean

export type NodeViewCreator<T extends ManuscriptNodeView> = (
  node: ManuscriptNode,
  view: ManuscriptEditorView,
  getPos: () => number | undefined,
  decorations: readonly Decoration[]
) => T

export interface ChangeReceiverCommand {
  childSections?: ManuscriptNode[]
}

export type ChangeReceiver = (
  op: string,
  id?: string,
  data?: ManuscriptNode | null,
  command?: ChangeReceiverCommand
) => void

export interface SyncError {
  _id: string
}

export type TrackableAttributes<T extends ManuscriptNode> = T['attrs'] & {
  dataTracked?: TrackedAttrs[]
}

export type Trackable<T extends ManuscriptNode> = Omit<T, 'attrs'> & {
  attrs: TrackableAttributes<T>
}

export type WidgetDecoration = Decoration & {
  type: { toDOM: () => HTMLElement; spec: Decoration['spec'] }
}

export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> &
  Pick<T, K>
