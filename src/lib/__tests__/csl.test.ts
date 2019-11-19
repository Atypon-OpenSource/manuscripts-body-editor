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
import {
  BibliographyItem,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'
import {
  convertBibliographyItemToData,
  convertDataToBibliographyItem,
  variableWrappers,
} from '../../csl'

describe('CSL', () => {
  test('converts data from CSL to bibliography items', () => {
    const data: CSL.Item = {
      id: 'foo',
      type: 'article',
      DOI: 'foo',
      illustrator: [{ family: 'Derp' }],
      accessed: { literal: 'yesterday' },
    }
    const bibItem = convertDataToBibliographyItem(data)
    expect(bibItem.DOI).toMatch(data.DOI!)
    expect(bibItem.type).toMatch('article')
    // tslint:disable-next-line:no-any
    expect((bibItem.illustrator as any)[0].objectType).toMatch(
      ObjectTypes.BibliographicName
    )
  })

  test('converts bibliography items to CSL', () => {
    const item: BibliographyItem = {
      _id: 'MPBibliographyItem:x',
      objectType: 'MPBibliographyItem',
      DOI: 'foo',
      accessed: {
        _id: 'MPBibliographicDate:63937364-97E6-4722-AA96-0841EFBBAA0D',
        literal: 'yesterday',
        objectType: 'MPBibliographicDate',
      },
      illustrator: [
        {
          _id: 'MPBibliographicName:003024D5-CC4B-4C9B-95EA-C1D24255827E',
          family: 'Derp',
          objectType: 'MPBibliographicName',
        },
      ],
      type: 'article',
      containerID: 'ProjectX',
      sessionID: 'test',
      createdAt: 0,
      updatedAt: 0,
    }
    const data = convertBibliographyItemToData(item)

    expect(data).toEqual({
      DOI: 'foo',
      accessed: { literal: 'yesterday' },
      id: 'MPBibliographyItem:x',
      illustrator: [{ family: 'Derp' }],
      type: 'article',
    })

    const itemMissingType = { ...item }
    delete itemMissingType.type
    const dataWithDefaultType = convertBibliographyItemToData(itemMissingType)

    expect(dataWithDefaultType).toEqual({
      DOI: 'foo',
      accessed: { literal: 'yesterday' },
      id: 'MPBibliographyItem:x',
      illustrator: [{ family: 'Derp' }],
      type: 'article-journal',
    })
  })

  test('wraps DOIs with links', () => {
    const wrapDOI = variableWrappers.DOI

    const itemData = {
      DOI: '10.1234/567',
    }

    expect(wrapDOI(itemData, itemData.DOI)).toBe(
      `<a href="https://doi.org/10.1234%2F567">10.1234/567</a>`
    )
  })

  test('wraps URLs with links', () => {
    const wrapURL = variableWrappers.URL

    const itemData = {
      URL: 'https://example.com',
    }

    expect(wrapURL(itemData, itemData.URL)).toBe(
      `<a href="https://example.com">https://example.com</a>`
    )
  })

  test('wraps titles with DOIs with links', () => {
    const wrapTitle = variableWrappers.title

    const itemData = {
      title: 'An example',
      DOI: '10.1234/567',
    }

    expect(wrapTitle(itemData, itemData.title)).toBe(
      `<a href="https://doi.org/10.1234%2F567">An example</a>`
    )
  })

  test('wraps titles with URLs with links', () => {
    const wrapTitle = variableWrappers.title

    const itemData = {
      title: 'An example',
      URL: 'https://example.com',
    }

    expect(wrapTitle(itemData, itemData.title)).toBe(
      `<a href="https://example.com">An example</a>`
    )
  })

  test('keeps HTML when wrapping titles with URLs with links', () => {
    const wrapTitle = variableWrappers.title

    const itemData = {
      title: 'An example with <i>some</i> markup',
      URL: 'https://example.com',
    }

    expect(wrapTitle(itemData, itemData.title)).toBe(
      `<a href="https://example.com">An example with <i>some</i> markup</a>`
    )
  })
})
