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
import { BibliographyItemType } from '@manuscripts/transform'

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
]

export const fieldConfigMap: Record<BibliographyItemType, Set<string>> = {
  'article-journal': new Set([
    'author',
    'title',
    'issued',
    'container-title',
    'volume',
    'issue',
    'supplement',
    'page',
    'locator',
    'comment',
    'DOI',
    'URL',
  ]),
  book: new Set([
    'author',
    'editor',
    'title',
    'issued',
    'container-title',
    'collection-title',
    'volume',
    'edition',
    'publisher-place',
    'publisher',
    'page',
    'number-of-pages',
    'comment',
    'DOI',
    'URL',
  ]),
  chapter: new Set([
    'author',
    'editor',
    'title',
    'issued',
    'container-title',
    'collection-title',
    'volume',
    'edition',
    'publisher-place',
    'publisher',
    'page',
    'number-of-pages',
    'comment',
    'DOI',
    'URL',
  ]),
  confproc: new Set([
    'author',
    'title',
    'issued',
    'publisher-place',
    'publisher',
    'event',
    'event-date',
    'event-place',
    'page',
    'DOI',
    'URL',
  ]),
  dataset: new Set([
    'author',
    'title',
    'issued',
    'container-title',
    'publisher-place',
    'publisher',
    'accessed',
    'comment',
    'DOI',
    'URL',
  ]),
  preprint: new Set([
    'author',
    'title',
    'issued',
    'container-title',
    'locator',
    'DOI',
    'URL',
  ]),
  standard: new Set(['std', 'URL']),
  thesis: new Set([
    'author',
    'title',
    'issued',
    'institution',
    'number-of-pages',
    'comment',
    'DOI',
    'URL',
  ]),
  webpage: new Set([
    'author',
    'title',
    'issued',
    'publisher-place',
    'publisher',
    'accessed',
    'comment',
  ]),
  other: new Set([
    'author',
    'title',
    'issued',
    'container-title',
    'publisher-place',
    'publisher',
    'comment',
  ]),
}
