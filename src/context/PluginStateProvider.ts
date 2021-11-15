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
import { EditorState, PluginKey } from 'prosemirror-state'

import { Observable } from '../lib/Observable'
import { EditorViewProvider } from './EditorViewProvider'

export class PluginStateProvider {
  _observable = new Observable<PluginKey>()
  viewProvider: EditorViewProvider

  constructor(viewProvider: EditorViewProvider) {
    this.viewProvider = viewProvider
  }

  getPluginState(p: PluginKey) {
    if (this.viewProvider._view) {
      return p.getState(this.viewProvider.view.state)
    }
    return null
  }

  updatePluginListeners(
    oldEditorState: EditorState,
    newEditorState: EditorState
  ) {
    Array.from(this._observable._observers.entries()).forEach(([p]) => {
      const oldState = p.getState(oldEditorState)
      const newState = p.getState(newEditorState)
      if (oldState !== newState) {
        this._observable.emit(p, newState)
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(pluginKey: PluginKey, cb: (data: any) => void) {
    this._observable.on(pluginKey, cb)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(pluginKey: PluginKey, cb: (data: any) => void) {
    this._observable.off(pluginKey, cb)
  }
}
