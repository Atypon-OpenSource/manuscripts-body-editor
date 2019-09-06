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

import { browserAdaptor } from 'mathjax-full/js/adaptors/browserAdaptor'
import { HTMLDocument } from 'mathjax-full/js/handlers/html/HTMLDocument'
import { HTMLMathItem } from 'mathjax-full/js/handlers/html/HTMLMathItem'
import { TeX } from 'mathjax-full/js/input/tex'
import { SVG } from 'mathjax-full/js/output/svg'
import 'mathjax-full/js/util/entities/all'

const InputJax = new TeX<HTMLElement, Text, Document>({})
// NOTE: fontCache: 'none' is set to avoid <defs> and <use xlink:href>
const OutputJax = new SVG<HTMLElement, Text, Document>({ fontCache: 'none' })
const doc = new HTMLDocument(document, browserAdaptor(), {
  InputJax,
  OutputJax,
})
doc.addStyleSheet()

export const typeset = (math: string, display: boolean) => {
  const item = new HTMLMathItem(math, InputJax, display)
  // TODO: set containerWidth and lineWidth for wrapping?
  item.setMetrics(16, 8, 1000000, 100000, 1)
  item.compile(doc)
  item.typeset(doc)
  return item.typesetRoot
}
