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

import { BibliographyItem } from '@manuscripts/json-schema'
import { convertCSLToBibliographyItem } from '@manuscripts/library'
import {
  BibliographyItemSearchResponse,
  BibliographyItemSource,
  Job,
} from '@manuscripts/style-guide'
import { buildBibliographyItem } from '@manuscripts/transform'
import axios from 'axios'

type CrossrefResponse = {
  message: {
    items: CSL.Data[]
    'total-results': number
  }
}

const search = (
  query: string,
  limit: number
): Job<BibliographyItemSearchResponse> => {
  const controller = new AbortController()

  const response = axios
    .get<CrossrefResponse>(`https://api.crossref.org/works`, {
      params: {
        filter: 'type:journal-article',
        query,
        rows: limit,
      },
      signal: controller.signal,
    })
    .then((r) => {
      if (r.status !== 200) {
        throw new Error('There was a problem searching for this query.')
      }

      const items = r.data.message.items
      const total = r.data.message['total-results']

      return {
        items: items.map((i) =>
          buildBibliographyItem(convertCSLToBibliographyItem(i))
        ) as BibliographyItem[],
        total,
      }
    })

  return {
    response: response,
    cancel: () => controller.abort(),
    isCancelled: controller.signal.aborted,
  }
}

export const crossref: BibliographyItemSource = {
  id: 'crossref',
  label: 'External sources',
  search,
}
