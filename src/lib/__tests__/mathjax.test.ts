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

import { convertToMathML } from '../mathjax-mathml'
import { convertToSVG } from '../mathjax-svg'

describe('mathjax', () => {
  it('generate inline svg', () => {
    const tex = '\\sqrt{2}-z_{foo}=\\sum{x}'
    const result = convertToSVG(tex, false)
    expect(result).toMatchSnapshot()
  })

  it('generate display svg', () => {
    const tex = '\\sqrt{2}-z_{foo}=\\sum{x}'
    const result = convertToSVG(tex, true)
    expect(result).toMatchSnapshot()
  })

  it('generate inline mathml', () => {
    const tex = '\\sqrt{2}-z_{foo}=\\sum{x}'
    const result = convertToMathML(tex, false)
    expect(result).toMatchSnapshot()
  })

  it('generate display mathml', () => {
    const tex = '\\sqrt{2}-z_{foo}=\\sum{x}'
    const result = convertToMathML(tex, true)
    expect(result).toMatchSnapshot()
  })
})
