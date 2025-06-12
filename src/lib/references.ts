/*!
 * © 2024 Atypon Systems LLC
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
import { Cite } from '@citation-js/core'
import {
  BibliographyItemAttrs,
  BibliographyItemType,
} from '@manuscripts/transform'

export const metadata = (item: BibliographyItemAttrs): string => {
  return [authors(item), item['container-title'], issuedYear(item)]
    .filter(Boolean)
    .join(', ')
}

export const issuedYear = (item: BibliographyItemAttrs): string => {
  if (
    !item.issued ||
    !item.issued['date-parts'] ||
    !item.issued['date-parts'][0] ||
    !item.issued['date-parts'][0][0]
  ) {
    return ''
  }

  const [[year]] = item.issued['date-parts']

  return `${year}`
}

export const authors = (item: BibliographyItemAttrs): string => {
  if (!item.author) {
    return ''
  }
  const authors = item.author
    .map((a) => a.family || a.literal || a.given)
    .filter(Boolean)

  if (authors.length > 1) {
    const last = authors.splice(-2)
    authors.push(last.join(' & '))
  }

  return authors.join(', ')
}

const loadCitationJsPlugins = async () => {
  try {
    await Promise.all([
      import('@citation-js/plugin-bibtex'),
      import('@citation-js/plugin-ris'),
      import('@citation-js/plugin-doi'),
      import('@citation-js/plugin-csl'),
      import('@citation-js/plugin-pubmed'),
      import('@citation-js/plugin-enw'),
    ])
  } catch (error) {
    console.error('Failed to load citation plugins:', error)
  }
}

export const importBibliographyItems = async (
  data: string
): Promise<BibliographyItemAttrs[]> => {
  await loadCitationJsPlugins()
  const cite = await Cite.async(data.trim())
  return cite.data
}

export const bibliographyItemTypes: [BibliographyItemType, string][] = [
  ['article-journal', 'Journal Article'],
  ['book', 'Book'],
  ['chapter', 'Chapter'],
  ['confproc', 'Conference Paper'],
  ['thesis', 'Thesis'],
  ['webpage', 'Web Page'],
  ['other', 'Other'],
  ['standard', 'Standard'],
  ['dataset', 'Dataset'],
  ['preprint', 'Preprint'],
  ['literal', 'Literal'],
]
