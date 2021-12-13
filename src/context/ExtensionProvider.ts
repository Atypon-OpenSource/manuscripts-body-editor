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
import { Plugin } from 'prosemirror-state'

import { Observable } from '../lib/Observable'
import { Commands } from '../typings/editor'
import { CreateExtension, Extension } from '../typings/extension'
import { EditorProviders } from './Providers'

interface State {
  extensions: Extension[]
  plugins: Plugin[]
  commands: Commands
}

export class ExtensionProvider {
  _observable = new Observable<'update'>()
  extensions: Extension[] = []
  plugins: Plugin[] = []
  commands: Commands = {}

  init(ctx: EditorProviders, createExtensions: CreateExtension[]) {
    const created = createExtensions.map((ext) => ext(ctx))
    this.extensions = created
    this.plugins = created.reduce(
      (acc, ext) => [...acc, ...(ext.plugins || [])],
      [] as Plugin[]
    )
    this.commands = created.reduce(
      (acc, ext) => Object.assign(acc, ext.commands),
      {} as Commands
    )
    const state: State = {
      extensions: this.extensions,
      plugins: this.plugins,
      commands: this.commands,
    }
    this._observable.emit('update', state)
  }

  getExtension(name: string) {
    return this.extensions.find((e) => e.name === name)
  }

  onUpdate(cb: (data: State) => void) {
    this._observable.on('update', cb)
  }

  offUpdate(cb: (data: State) => void) {
    this._observable.off('update', cb)
  }

  destroy() {
    this.extensions.forEach((e) => e.onDestroy && e.onDestroy())
  }
}
