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

export class ExtensionProvider {
  _observable = new Observable<'update'>()
  _extensionListeners = new Observable<string>()
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
    this._observable.emit('update', this)
  }

  getExtension<T extends Extension>(name: string) {
    const ext = this.extensions.find((e) => e.name === name)
    if (!ext) {
      throw Error('No extension found with name: ' + name)
    }
    return ext as T
  }

  // eslint-disable-next-line
  emitExtensionUpdate(name: string, data: any) {
    this._extensionListeners.emit(name, data)
  }

  onExtensionUpdate<T>(name: string, cb: (data: T) => void) {
    this._extensionListeners.on(name, cb)
  }

  offExtensionUpdate<T>(name: string, cb: (data: T) => void) {
    this._extensionListeners.off(name, cb)
  }

  onUpdate(cb: (data: ExtensionProvider) => void) {
    this._observable.on('update', cb)
  }

  offUpdate(cb: (data: ExtensionProvider) => void) {
    this._observable.off('update', cb)
  }

  destroy() {
    this.extensions.forEach((e) => e.onDestroy && e.onDestroy())
  }
}
