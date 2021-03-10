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

import * as lib from '../helpers'

describe('mergeSimilarItems', () => {
  it('should not change the array if no items are similar', () => {
    const merger = lib.mergeSimilarItems<string>(
      (a, b) => a === b,
      (a, b) => `${a}-${b}`
    )
    const init = ['one', 'two']
    expect(merger(init)).toEqual(init)
  })

  it('should collapse any items that are similar', () => {
    const merger = lib.mergeSimilarItems<string>(
      () => true,
      (a, b) => `${a}-${b}`
    )
    const init = ['one', 'two']
    expect(merger(init)).toEqual(['one-two'])
  })

  it('should be able to collapse multiple items', () => {
    const merger = lib.mergeSimilarItems<number>(
      (a, b) => !!(a % 2) && !!(b % 2),
      (a) => a
    )
    const init = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    expect(merger(init)).toEqual([1, 2, 4, 6, 8])
  })
})
