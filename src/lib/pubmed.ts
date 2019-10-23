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

import { CSL } from '@manuscripts/manuscript-transform'
import { BibliographyItem } from '@manuscripts/manuscripts-json-schema'
import { EUtilsError, toCSL } from 'astrocite-eutils'
import { Response } from 'astrocite-eutils/lib/schema'
import axios from 'axios'
import { convertDataToBibliographyItem } from '../csl'

interface SearchResults {
  items: BibliographyItem[]
  total: number
}

const buildQueryTerm = (query: string) => {
  const trimmedQuery = query.trim()

  if (trimmedQuery.match(/^10\.\S+\/\S+$/)) {
    return `${trimmedQuery}[DOI]`
  }

  if (trimmedQuery.match(/^\d+$/)) {
    return `${trimmedQuery}[PMID]`
  }

  return trimmedQuery
}

const search = async (
  query: string,
  rows: number,
  mailto: string
): Promise<SearchResults> => {
  const term = buildQueryTerm(query)

  const searchResponse = await axios.get<{
    esearchresult: {
      count: string
      querykey: string
      webenv: string
    }
  }>('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
    params: {
      db: 'pubmed',
      term,
      usehistory: 'y',
      retmode: 'json',
      retmax: 0,
      email: mailto,
    },
  })

  if (searchResponse.status !== 200) {
    throw new Error('There was a problem searching for this query.')
  }

  const {
    esearchresult: { count, querykey, webenv },
  } = searchResponse.data

  const summaryResponse = await axios.get<Response>(
    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi',
    {
      params: {
        db: 'pubmed',
        query_key: querykey,
        WebEnv: webenv,
        retmode: 'json',
        retmax: rows,
        email: mailto,
      },
    }
  )

  if (summaryResponse.status !== 200) {
    throw new Error('There was a problem fetching results for this query.')
  }

  const results = toCSL(summaryResponse.data)

  const items: CSL.Item[] = []

  for (const item of results) {
    if (!(item instanceof EUtilsError)) {
      items.push(item as CSL.Item)
    }
  }

  return {
    items: items.map(convertDataToBibliographyItem) as BibliographyItem[],
    total: Number(count),
  }
}

const fetch = async (id: string, mailto: string) => {
  const summaryResponse = await axios.get<Response>(
    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi',
    {
      params: {
        db: 'pubmed',
        id,
        retmode: 'json',
        email: mailto,
      },
    }
  )

  if (summaryResponse.status !== 200) {
    throw new Error('There was a problem fetching this PMID.')
  }

  const results = toCSL(summaryResponse.data)

  const [item] = results

  if (!item) {
    throw new Error('An item with this PMID could not be found.')
  }

  if (item instanceof EUtilsError) {
    throw new Error('There was a problem fetching this PMID.')
  }

  return convertDataToBibliographyItem(item as CSL.Item)
}

export const pubmed = { fetch, search }
