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

import { allowedHref } from '../url'

describe('url', () => {
  test('allows valid protocols', () => {
    expect(allowedHref('http://example.com')).toBe(true)
    expect(allowedHref('https://example.com')).toBe(true)
    expect(allowedHref('ftp://example.com')).toBe(true)
    expect(allowedHref(' http://example.com')).toBe(true) // leading space
  })

  test('rejects invalid protocols', () => {
    expect(allowedHref('javascript:alert("hi")')).toBe(false)
    expect(allowedHref('httpp://example.com')).toBe(false)
  })
})
