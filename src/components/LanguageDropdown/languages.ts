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
export const ENGLISH_FALLBACK = {
  code: 'en',
  name: 'English',
  nativeName: 'English',
}

export const getSelectedLanguageName = (
  selectedLanguage: string,
  allLanguages: Array<{ code: string; name: string; nativeName?: string }>
) => {
  if (!allLanguages.length) {
    return 'English (Default)'
  }

  const language =
    allLanguages.find((lang) => lang.code === selectedLanguage) ||
    ENGLISH_FALLBACK

  return language.nativeName && language.nativeName !== language.name
    ? `${language.name} (${language.nativeName})`
    : language.name
}

export const getLanguageDisplayName = (languageCode: string): string => {
  return languageCode.toUpperCase()
}
