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

import purify, { Config } from 'dompurify'

type Sanitize = (
  dirty: string,
  config?: Pick<Config, 'USE_PROFILES' | 'ALLOWED_TAGS'>
) => DocumentFragment

export interface Purify {
  sanitize: Sanitize
}

export const sanitize: Sanitize = (dirty, config) =>
  purify.sanitize(dirty, {
    RETURN_DOM_FRAGMENT: true,
    RETURN_DOM_IMPORT: true,
    ...config,
  })
