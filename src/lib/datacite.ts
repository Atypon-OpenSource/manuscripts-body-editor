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

import { stringify } from 'qs'
import { convertDataToBibliographyItem } from '../csl'

interface DataCiteItem {
  attributes: {
    doi: string
  }
}

const search = (query: string, rows: number) =>
  window
    .fetch(
      'https://api.datacite.org/works?' +
        stringify({
          query,
          'page[size]': rows,
        })
    )
    .then(response => response.json())
    .then(({ data, total }) => ({
      items: data.map((item: DataCiteItem) => ({
        ...item.attributes,
        DOI: item.attributes.doi,
      })),
      total,
    }))

const fetch = (doi: string) =>
  window
    .fetch('https://data.datacite.org/' + encodeURIComponent(doi), {
      headers: {
        Accept: 'application/vnd.citationstyles.csl+json',
      },
    })
    .then(response => response.json())
    .then(convertDataToBibliographyItem)

export const datacite = { fetch, search }
