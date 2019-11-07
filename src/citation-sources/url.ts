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
import axios from 'axios'
import { convertDataToBibliographyItem } from '../csl'

interface SearchResults {
  items: BibliographyItem[]
  total: number
}

const client = axios.create({
  baseURL: process.env.ZOTERO_TRANSLATION_SERVER || 'http://0.0.0.0:1969',
})

const translate = async (query: string, rows: number) => {
  const response = await client.post('/web', query, {
    headers: { 'Content-Type': 'text/plain' },
    validateStatus: status => status === 200 || status === 300,
  })

  switch (response.status) {
    case 200:
      return { data: response.data, total: 1 }

    case 300:
      const entries = Object.entries(response.data.items)
      const total = entries.length

      response.data.items = Object.fromEntries(entries.slice(0, rows))

      const { data } = await client.post('/web', response.data, {
        headers: { 'Content-Type': 'application/json' },
      })

      return { data, total }

    default:
      throw new Error(`Unexpected status ${response.status}`)
  }
}

const convert = async (data: object[], format: string) => {
  const response = await client.post('/export', data, {
    params: { format },
    headers: { 'Content-Type': 'application/json' },
    validateStatus: status => status === 200 || status === 300,
  })

  return response.data.map(convertDataToBibliographyItem) as BibliographyItem[]
}

const search = async (query: string, rows: number): Promise<SearchResults> => {
  const { data, total } = await translate(query, rows)

  const items = await convert(data, 'csljson')

  return { items, total }
}

// simply return the item, as it's already been converted
const fetch = async (
  item: Partial<BibliographyItem>
): Promise<Partial<BibliographyItem>> => item

export const url = { fetch, search }
