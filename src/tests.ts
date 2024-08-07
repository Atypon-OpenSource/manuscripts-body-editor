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

import 'regenerator-runtime/runtime'

import { TextDecoder, TextEncoder } from 'util'
import { v4 as uuid } from 'uuid'

process.env.API_BASE_URL = 'https://127.0.0.1/'

const supportedCommands: string[] = []

Object.defineProperty(document, 'queryCommandSupported', {
  value: (cmd: string) => supportedCommands.includes(cmd),
})

Object.defineProperty(document, 'execCommand', {
  value: (cmd: string) => supportedCommands.includes(cmd),
})

if (!window.URL.createObjectURL) {
  Object.defineProperty(window.URL, 'createObjectURL', {
    value: jest.fn(() => 'blob:https://localhost/' + uuid()),
  })
}

Object.assign(global, { TextDecoder, TextEncoder })
