/*!
 * © 2024 Atypon Systems LLC
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

import { MATHJAX_VERSION } from '../versions'

const src = `https://cdn.jsdelivr.net/npm/mathjax@${MATHJAX_VERSION}/es5/tex-svg.js`

/**
 * MathJax uses delimiters to find math in the doc by default, which is
 * not what we want. This will override that behavior and will instead
 * look for equation nodes, and is based on the
 * [MathJax upgrade guide](https://docs.mathjax.org/en/v3.2-latest/upgrading/v2.html).
 */
//@ts-ignore
const findMath = (doc) => {
  let nodes = doc.options.elements
  if (!nodes) {
    nodes = doc.document.querySelectorAll('.equation')
  }
  for (const node of nodes) {
    const math = new doc.options.MathItem(
      node.textContent,
      doc.inputJax[0],
      node.tagName !== 'SPAN'
    )
    const text = document.createTextNode('')
    node.innerHTML = ''
    node.appendChild(text)
    math.start = { node: text, delim: '', n: 0 }
    math.end = { node: text, delim: '', n: 0 }
    doc.math.push(math)
  }
}

const config = {
  options: {
    renderActions: {
      find: [10, findMath, ''],
    },
  },
}

export const initMathJax = () => {
  // @ts-ignore
  window.MathJax = config
  const script = document.createElement('script')
  script.src = src
  script.async = true
  document.head.appendChild(script)
}

export const renderMath = (node: HTMLElement) => {
  //@ts-ignore
  if (!window.MathJax) {
    initMathJax()
  }
  //@ts-ignore
  if (window.MathJax.typeset && node.parentNode) {
    //@ts-ignore
    window.MathJax.typeset([node])
  }
}
