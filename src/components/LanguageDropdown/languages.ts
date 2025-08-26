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
import isoLanguages from '@cospired/i18n-iso-languages'

// Language information for common languages
export const COMMON_LANGUAGES_INFO: Record<
  string,
  { englishName: string; nativeName: string }
> = {
  en: { englishName: 'English', nativeName: 'Default' },
  es: { englishName: 'Spanish', nativeName: 'Español' },
  fr: { englishName: 'French', nativeName: 'Français' },
  de: { englishName: 'German', nativeName: 'Deutsch' },
  it: { englishName: 'Italian', nativeName: 'Italiano' },
  pt: { englishName: 'Portuguese', nativeName: 'Português' },
  ru: { englishName: 'Russian', nativeName: 'Русский' },
  ja: { englishName: 'Japanese', nativeName: '日本語' },
  ko: { englishName: 'Korean', nativeName: '한국어' },
  zh: { englishName: 'Chinese', nativeName: '中文' },
  ar: { englishName: 'Arabic', nativeName: 'العربية' },
}

export const COMMON_LANGUAGES = Object.keys(COMMON_LANGUAGES_INFO)

export const ENGLISH_FALLBACK = {
  code: 'en',
  name: 'English',
  nativeName: 'English',
  isCommon: true,
}

export interface LanguageOption {
  code: string
  name: string
  nativeName?: string
  isCommon: boolean
}

export const initializeLanguageData = async (): Promise<void> => {
  try {
    const englishLanguageData = await import(
      '@cospired/i18n-iso-languages/langs/en.json'
    )
    isoLanguages.registerLocale(englishLanguageData.default)
  } catch (error) {
    console.error('Failed to initialize language data:', error)
    throw error
  }
}

// Load all available languages
export const loadAllLanguages = async (): Promise<LanguageOption[]> => {
  try {
    await initializeLanguageData()

    const languageCodes = isoLanguages.getAlpha2Codes()
    return Object.keys(languageCodes).map((code) => {
      const commonLanguageInfo = COMMON_LANGUAGES_INFO[code]

      return {
        code,
        name:
          commonLanguageInfo?.englishName ||
          isoLanguages.getName(code, 'en') ||
          code.toUpperCase(),
        nativeName:
          commonLanguageInfo?.nativeName ||
          isoLanguages.getName(code, code) ||
          undefined,
        isCommon: COMMON_LANGUAGES.includes(code),
      }
    })
  } catch (error) {
    console.error('Failed to load languages:', error)
    return [ENGLISH_FALLBACK]
  }
}

export const getSelectedLanguageName = (
  selectedLanguage: string,
  allLanguages: LanguageOption[]
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
  // Use predefined language info for common languages
  const languageInfo = COMMON_LANGUAGES_INFO[languageCode]
  if (languageInfo) {
    const { englishName, nativeName } = languageInfo

    // Return formatted name if native name is different from English name
    if (nativeName !== englishName && nativeName !== 'Default') {
      return `${englishName} (${nativeName})`
    }

    return englishName
  }

  // For other languages, try to get from library

  const englishName = isoLanguages.getName(languageCode, 'en')
  if (englishName) {
    return englishName
  }

  return languageCode.toUpperCase()
}

// Sort languages with common languages first, then alphabetically
export const sortLanguagesByCommonality = (
  languages: LanguageOption[]
): LanguageOption[] => {
  return [...languages].sort((a, b) => {
    if (a.isCommon && !b.isCommon) {
      return -1
    }
    if (!a.isCommon && b.isCommon) {
      return 1
    }

    return a.name.localeCompare(b.name)
  })
}
