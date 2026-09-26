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

const englishNames = new Intl.DisplayNames(['en'], { type: 'language' })

const labelCache = new Map<string, string>()

export const getLanguageLabel = (code: string): string => {
  const cached = labelCache.get(code)
  if (cached !== undefined) {
    return cached
  }
  const label = computeLanguageLabel(code)
  labelCache.set(code, label)
  return label
}

const computeLanguageLabel = (code: string): string => {
  try {
    const name = englishNames.of(code) ?? code
    const nativeName = new Intl.DisplayNames([code], { type: 'language' }).of(
      code
    )
    return nativeName && nativeName !== name ? `${name} (${nativeName})` : name
  } catch {
    return code || 'English'
  }
}
