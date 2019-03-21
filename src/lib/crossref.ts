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

import { BibliographyItem } from '@manuscripts/manuscripts-json-schema'
import { stringify } from 'qs'
import { convertDataToBibliographyItem } from '../csl'

interface SearchResults {
  items: BibliographyItem[]
  total: number
}

// TODO: restore request URLs once this Crossref API issue is fixed:
// https://github.com/CrossRef/rest-api-doc/issues/413

const search = async (
  query: string,
  rows: number,
  mailto: string
): Promise<SearchResults> => {
  // if the query is just a DOI, fetch that single record
  if (query.trim().match(/^10\.\S+\/\S+$/)) {
    return searchByDOI(query.trim(), mailto)
  }

  // const response = await window.fetch(
  //   'https://api.crossref.org/works?' +
  //   stringify({
  //     filter: 'type:journal-article',
  //     query,
  //     rows,
  //     mailto,
  //   })
  // )

  const response = await window.fetch(
    `https://api.crossref.org/works?mailto=${mailto}&` +
      stringify({
        filter: 'type:journal-article',
        query,
        rows,
      })
  )

  if (!response.ok) {
    throw new Error('There was a problem searching for this query.')
  }

  const {
    message: { items, 'total-results': total },
  } = await response.json()

  return {
    items: items.map(convertDataToBibliographyItem),
    total,
  }
}

const searchByDOI = async (
  doi: string,
  mailto: string
): Promise<SearchResults> => {
  // const response = await window.fetch(
  //   `https://api.crossref.org/works/${encodeURIComponent(doi)}?` +
  //     stringify({
  //       mailto,
  //     })
  // )

  const response = await window.fetch(
    `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${mailto}`
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('An item with this DOI could not be found.')
    }
    throw new Error('There was a problem searching for this DOI.')
  }

  const { message } = await response.json()

  const item = convertDataToBibliographyItem(message) as BibliographyItem

  return {
    items: [item],
    total: 1,
  }
}

const fetch = async (doi: string, mailto: string) => {
  // NOTE: avoiding https://api.crossref.org/works/{doi}/transform/application/vnd.citationstyles.csl+json as it's undocumented and could disappear.

  // NOTE: Using data.crossref.org rather than doi.org to avoid the redirect.
  // This is safe as it's only resolving Crossref DOIs.

  const response = await window.fetch(
    `https://data.crossref.org/${encodeURIComponent(doi)}`,
    {
      headers: {
        accept: 'application/vnd.citationstyles.csl+json',
      },
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('An item with this DOI could not be found.')
    }
    throw new Error('There was a problem fetching this DOI.')
  }

  const data = await response.json()

  return convertDataToBibliographyItem(data)
}

export const crossref = { fetch, search }
