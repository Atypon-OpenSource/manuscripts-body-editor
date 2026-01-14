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

export interface Language {
  code: string
  name: string
  nativeName: string
}

const ENGLISH = {
  code: 'en',
  name: 'English',
  nativeName: 'English',
}

export const getLanguage = (code: string, languages: Language[]) => {
  return languages.find((l) => l.code === code) || ENGLISH
}

export const getLanguageLabel = (language: Language) => {
  return language.nativeName && language.nativeName !== language.name
    ? `${language.name} (${language.nativeName})`
    : language.name
}
