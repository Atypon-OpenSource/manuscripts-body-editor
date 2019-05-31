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

import { schema } from '@manuscripts/manuscript-transform'
import { Node } from 'prosemirror-model'
import {
  buildNodeStatistics,
  buildText,
  countCharacters,
  countWords,
} from '../statistics'

const node = Node.fromJSON(schema, {
  type: 'manuscript',
  content: [
    {
      type: 'section',
      content: [
        {
          type: 'section_title',
          content: [
            {
              type: 'text',
              text: 'Introduction',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text:
                'Every conscious movement a person makes, whether lifting a pencil or playing a violin, begins in the brain.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text:
                'These rhythmic patterns then sum together to create the signals that muscles need to carry out the movements.',
            },
          ],
        },
      ],
    },
  ],
})

test('statistics', () => {
  const text = buildText(node)
  expect(text).toBe(
    'Introduction Every conscious movement a person makes, whether lifting a pencil or playing a violin, begins in the brain. These rhythmic patterns then sum together to create the signals that muscles need to carry out the movements.'
  )

  const words = countWords(text)
  expect(words).toBe(37)

  const characters = countCharacters(text)
  expect(characters).toBe(229)

  const statistics = buildNodeStatistics(node)
  expect(statistics.text).toBe(text)
  expect(statistics.words).toBe(words)
  expect(statistics.characters).toBe(characters)
})
