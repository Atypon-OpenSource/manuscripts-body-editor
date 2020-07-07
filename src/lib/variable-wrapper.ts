/*!
 * © 2020 Atypon Systems LLC
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

import { CSL } from '@manuscripts/manuscript-transform'
import CiteProc from 'citeproc'

const createDoiUrl = (doi: string) =>
  'https://doi.org/' + encodeURIComponent(doi.replace(/^.*?(10\.)/, '$1'))

const createLink = (url: string, contents: string): Element => {
  const element = document.createElement('a')
  element.setAttribute('href', url)
  element.innerHTML = contents // IMPORTANT: this is HTML so must be sanitised later

  return element
}

const createSpan = (contents: string): Element => {
  const element = document.createElement('span')
  element.innerHTML = contents // IMPORTANT: this is HTML so must be sanitised later

  return element
}

const wrapVariable = (
  field: string,
  itemData: CSL.Item,
  str: string
): Element => {
  switch (field) {
    case 'title': {
      if (itemData.DOI) {
        return createLink(createDoiUrl(itemData.DOI), str)
      }

      if (itemData.URL) {
        return createLink(itemData.URL, str)
      }

      return createSpan(str)
    }

    case 'URL':
      return createLink(str, str)

    case 'DOI':
      return createLink(createDoiUrl(str), str)

    default:
      return createSpan(str)
  }
}

export const variableWrapper: CiteProc.VariableWrapper = (
  params,
  prePunct,
  str,
  postPunct
) => {
  if (params.context === 'bibliography') {
    const fields = params.variableNames.join(' ')

    const element = wrapVariable(fields, params.itemData, str)

    element.setAttribute('data-field', fields)

    return `${prePunct}${element.outerHTML}${postPunct}`
  }

  return `${prePunct}${str}${postPunct}`
}
