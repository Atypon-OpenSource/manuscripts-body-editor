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
import { Slice } from 'prosemirror-model'
import { transformPasted } from '../paste'

test('transformPasted handler', () => {
  const slice = Slice.fromJSON(schema, {
    content: [
      {
        type: 'paragraph',
        attrs: {},
        content: [{ type: 'hard_break' }],
      },
      {
        type: 'paragraph',
        attrs: {
          id: 'p-1',
        },
        content: [
          {
            type: 'text',
            text:
              'These rhythmic patterns then sum together to create the signals that muscles need to carry out the movements.',
          },
        ],
      },
    ],
    openStart: 1,
    openEnd: 1,
  })

  expect(slice.content.childCount).toBe(2)
  expect(slice.content.child(1).attrs.id).toBe('p-1')

  const result = transformPasted(slice)

  expect(result.content.childCount).toBe(1)
  expect(result.content.size).toBe(111)
  expect(slice.content.child(0).attrs.id).toBeNull()

  expect(result).toMatchSnapshot('transform-pasted')
})
