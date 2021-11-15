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
import { Keymap } from 'prosemirror-commands'
import type { Plugin } from 'prosemirror-state'

import type { EditorProviders } from '../context'
import type { Commands } from './editor'

export type CreateExtension = (ctx: EditorProviders) => Extension
export interface Extension {
  name: string
  commands?: Commands
  keymaps?: Keymap[]
  plugins?: Plugin[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store?: Record<string, any>
  onDestroy?: () => void
}
