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
import { BibliographyItemNode, CitationNode } from '@manuscripts/transform'

import { TrackableAttributes } from '../types'

export type BibliographyItemAttrs = TrackableAttributes<BibliographyItemNode>
export type CitationAttrs = TrackableAttributes<CitationNode>

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
