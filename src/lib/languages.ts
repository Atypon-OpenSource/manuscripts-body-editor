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

// Host apps send just the codes they support; display names come from the
// browser's own CLDR data via Intl.DisplayNames rather than being
// hand-maintained (and kept in sync) in every host app.
const englishNames = new Intl.DisplayNames(['en'], { type: 'language' })

export const getLanguageLabel = (code: string): string => {
  try {
    const name = englishNames.of(code) ?? code
    const nativeName = new Intl.DisplayNames([code], { type: 'language' }).of(
      code
    )
    return nativeName && nativeName !== name ? `${name} (${nativeName})` : name
  } catch {
    // Intl.DisplayNames throws RangeError on a malformed/empty code (e.g. a
    // stale value from an older document) — fall back to showing it as-is
    // rather than crashing the widget.
    return code || 'English'
  }
}
