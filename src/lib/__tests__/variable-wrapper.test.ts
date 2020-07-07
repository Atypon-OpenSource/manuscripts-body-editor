/*!
 * © 2020 Atypon Systems LLC
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
import { variableWrapper } from '../variable-wrapper'

describe('bibliography variable wrapper', () => {
  test('wraps DOIs with links', () => {
    const itemData = {
      DOI: '10.1234/567.10.foo',
    }

    const result = variableWrapper(
      {
        context: 'bibliography',
        itemData,
        variableNames: ['DOI'],
      },
      '',
      '10.1234/567.10.foo',
      ''
    )

    expect(result).toBe(
      '<a href="https://doi.org/10.1234%2F567.10.foo" data-field="DOI">10.1234/567.10.foo</a>'
    )
  })

  test('wraps URLs with links', () => {
    const itemData = {
      URL: 'https://example.com',
    }

    const result = variableWrapper(
      {
        context: 'bibliography',
        itemData,
        variableNames: ['URL'],
      },
      '',
      'https://example.com',
      ''
    )

    expect(result).toBe(
      '<a href="https://example.com" data-field="URL">https://example.com</a>'
    )
  })

  test('wraps titles with DOIs with links', () => {
    const itemData = {
      title: 'An example',
      DOI: '10.1234/567',
    }

    const result = variableWrapper(
      {
        context: 'bibliography',
        itemData,
        variableNames: ['title'],
      },
      '',
      'An example',
      ''
    )

    expect(result).toBe(
      '<a href="https://doi.org/10.1234%2F567" data-field="title">An example</a>'
    )
  })

  test('wraps titles with URLs with links', () => {
    const itemData = {
      title: 'An example',
      URL: 'https://example.com',
    }

    const result = variableWrapper(
      {
        context: 'bibliography',
        itemData,
        variableNames: ['title'],
      },
      '',
      'An example',
      ''
    )

    expect(result).toBe(
      '<a href="https://example.com" data-field="title">An example</a>'
    )
  })

  test('keeps HTML when wrapping titles with URLs with links', () => {
    const itemData = {
      title: 'An example with <i>some</i> markup',
      URL: 'https://example.com',
    }

    const result = variableWrapper(
      {
        context: 'bibliography',
        itemData,
        variableNames: ['title'],
      },
      '',
      'An example with <i>some</i> markup',
      ''
    )

    expect(result).toBe(
      `<a href="https://example.com" data-field="title">An example with <i>some</i> markup</a>`
    )
  })
})
