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

import { crossref } from '../crossref'
import fetchResponse from './__fixtures__/crossref-fetch.json'

describe('crossref', () => {
  test('fetch', async () => {
    jest.setTimeout(120000)
    const mockClient = new AxiosMockAdapter(axios)

    mockClient
      .onGet(
        `https://api.crossref.org/works/10.1037%2F0003-066x.59.1.29/transform/application/vnd.citationstyles.csl+json`
      )
      .reply(async () => {
        return [200, fetchResponse]
      })

    const response = crossref.fetch({ DOI: '10.1037/0003-066x.59.1.29' })

    const item = await response

    expect(item.DOI?.toLocaleLowerCase()).toBe('10.1037/0003-066x.59.1.29')
    expect(item.title).toBe('How the Mind Hurts and Heals the Body.')
    expect(item.author).toHaveLength(1)
  })
})
