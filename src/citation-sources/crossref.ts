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

import { convertCSLToBibliographyItem } from '@manuscripts/library'
import { BibliographyItem } from '@manuscripts/manuscripts-json-schema'
import axios from 'axios'

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
  const response = await axios.get<{
    message: {
      items: CSL.Data[]
      'total-results': number
    }
  }>(`https://api.crossref.org/works?mailto=${mailto}`, {
    params: {
      filter: 'type:journal-article',
      query,
      rows,
    },
  })

  if (response.status !== 200) {
    throw new Error('There was a problem searching for this query.')
  }

  const {
    message: { items, 'total-results': total },
  } = response.data

  return {
    items: items.map(convertCSLToBibliographyItem) as BibliographyItem[],
    total,
  }
}

const searchByDOI = async (
  doi: string,
  mailto: string
): Promise<SearchResults> => {
  const response = await axios.get<{ message: CSL.Data }>(
    `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${mailto}`
  )

  if (response.status === 404) {
    throw new Error('An item with this DOI could not be found.')
  }

  if (response.status !== 200) {
    throw new Error('There was a problem searching for this DOI.')
  }

  const { message } = response.data

  const item = convertCSLToBibliographyItem(message) as BibliographyItem

  return {
    items: [item],
    total: 1,
  }
}

const fetch = async (item: Partial<BibliographyItem>) => {
  if (!item.DOI) {
    throw new Error('The item does not have a DOI')
  }
  // This is safe as it's only resolving Crossref DOIs.
  const response = await axios.get<CSL.Data>(
    `https://api.crossref.org/works/${encodeURIComponent(
      item.DOI
    )}/transform/application/vnd.citationstyles.csl+json`,
    {
      headers: {},
    }
  )

  if (response.status === 404) {
    throw new Error('An item with this DOI could not be found.')
  }

  if (response.status !== 200) {
    throw new Error('There was a problem fetching this DOI.')
  }

  return convertCSLToBibliographyItem(response.data)
}

export const crossref: {
  fetch: (item: Partial<BibliographyItem>) => Promise<Partial<BibliographyItem>>
  search: (
    query: string,
    rows: number,
    mailto: string
  ) => Promise<SearchResults>
} = { fetch, search }
