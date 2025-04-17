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

import {
  BibliographicDate,
  buildBibliographicDate,
  buildBibliographicName,
  generateID,
  ObjectTypes,
} from '@manuscripts/json-schema'
import { fixCSLData } from '@manuscripts/library'

import {
  BibliographyItemSearch,
  BibliographyItemSource,
} from '../components/references/BibliographyItemSource'
import { BibliographyItemAttrs } from './references'

type CrossrefResponse = {
  message: {
    items: CSL.Data[]
    'total-results': number
  }
}

const search = (query: string, limit: number): BibliographyItemSearch => {
  const controller = new AbortController()
  const params = new URLSearchParams({
    filter: 'type:journal-article',
    query,
    rows: String(limit),
  })

  const promise = searchAsync(params, controller)

  return new BibliographyItemSearch((resolve, reject) => {
    promise.then(resolve).catch(reject)
  }, controller)
}

const searchAsync = async (
  params: URLSearchParams,
  controller: AbortController
) => {
  const response = await fetch(`https://api.crossref.org/works?${params}`, {
    signal: controller.signal,
  })

  if (!response.ok) {
    throw new Error('There was a problem searching for this query.')
  }
  const data = (await response.json()) as CrossrefResponse
  const items = data.message.items
  const total = data.message['total-results']

  return {
    items: items.map((i) => parseCSLData(fixCSLData(i))),
    total,
  }
}

const parseCSLData = (data: CSL.Data): BibliographyItemAttrs => ({
  id: generateID(ObjectTypes.BibliographyItem),
  type: data.type,
  author: data.author?.map(buildBibliographicName),
  issued: buildBibliographicDate(data.issued as BibliographicDate),
  'container-title': data['container-title'],
  DOI: data.DOI,
  volume: data.volume ? String(data.volume) : undefined,
  issue: data.issue ? String(data.issue) : undefined,
  page: data.page,
  title: data.title,
})

export const Crossref: BibliographyItemSource = {
  id: 'crossref',
  label: 'External sources',
  search,
}
