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

import { convertMathMLToSVG } from '../mathml-to-svg'
import { convertTeXToSVG } from '../tex-to-svg'

describe('mathjax', () => {
  it('generate inline svg', async () => {
    const tex = '\\sqrt{2}-z_{foo}=\\sum{x}'
    const result = await convertTeXToSVG(tex, false)
    expect(result).toMatchSnapshot()
  })

  it('generate display svg', async () => {
    const tex = '\\sqrt{2}-z_{foo}=\\sum{x}'
    const result = await convertTeXToSVG(tex, true)
    expect(result).toMatchSnapshot()
  })

  it('converts mathml to svg', async () => {
    const mathml = `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msqrt>
    <mn>2</mn>
  </msqrt>
  <mo>&#x2212;</mo>
  <msub>
    <mi>z</mi>
    <mrow>
      <mi>f</mi>
      <mi>o</mi>
      <mi>o</mi>
    </mrow>
  </msub>
  <mo>=</mo>
  <mo>&#x2211;</mo>
  <mrow>
    <mi>x</mi>
  </mrow>
</math>`
    const result = await convertMathMLToSVG(mathml, true)
    expect(result).toMatchSnapshot()
  })
})
