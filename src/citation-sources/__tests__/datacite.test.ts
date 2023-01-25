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

import axios from 'axios'
import AxiosMockAdapter from 'axios-mock-adapter'

import { datacite } from '../datacite'
import fetchResponse from './__fixtures__/datacite-fetch.json'
import searchResponse from './__fixtures__/datacite-search.json'

describe('datacite', () => {
  test('search', async () => {
    const mockClient = new AxiosMockAdapter(axios)

    mockClient
      .onGet('https://api.datacite.org/dois')
      .reply(async (requestConfig) => {
        expect(requestConfig.params).toStrictEqual({
          'page[size]': 5,
          query: 'test',
        })

        return [200, searchResponse]
      })

    const { items } = await datacite.search('test', 5)

    expect(items).toHaveLength(5)

    const [item] = items

    expect(item.DOI).toBe('10.5255/ukda-sn-6926-1')
    expect(item.title).toBe('Road Accident Data, 2010')
    expect(item.author).toHaveLength(1)
    expect(item.issued!['date-parts']![0]).toEqual(['2011'])

    const lastItem = items[items.length - 1]
    expect(lastItem.title).toBeUndefined()
    expect(lastItem.issued).toBeUndefined()
    expect(lastItem.author).toHaveLength(0)
  })

  test('fetch', async () => {
    const mockClient = new AxiosMockAdapter(axios)

    mockClient
      .onGet('https://api.datacite.org/dois/10.5255%2Fukda-sn-6926-1')
      .reply(async (requestConfig) => {
        // @ts-ignore
        expect(requestConfig.headers.Accept).toBe(
          'application/vnd.citationstyles.csl+json'
        )

        return [200, fetchResponse]
      })

    const response = datacite.fetch({ DOI: '10.5255/ukda-sn-6926-1' })

    const item = await response

    expect(item.DOI).toBe('10.5255/UKDA-SN-6926-1')
    expect(item.title).toBe('Road Accident Data, 2010')
    expect(item.author).toHaveLength(1)
    expect(item.issued!['date-parts']![0]).toEqual([2011])
  })
})
