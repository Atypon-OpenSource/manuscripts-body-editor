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

import 'mathjax-full/js/util/entities/all'

import { HTMLAdaptor } from 'mathjax-full/js/adaptors/HTMLAdaptor'
import { STATE } from 'mathjax-full/js/core/MathItem.js'
import { SerializedMmlVisitor } from 'mathjax-full/js/core/MmlTree/SerializedMmlVisitor'
import { HTMLDocument } from 'mathjax-full/js/handlers/html/HTMLDocument'
import { TeX } from 'mathjax-full/js/input/tex'

import { packages } from './mathjax-packages'

// TeX input
const InputJax = new TeX<HTMLElement, Text, Document>({
  packages,
})

// @ts-ignore
const adaptor = new HTMLAdaptor<HTMLElement, Text, Document>(window)

const doc = new HTMLDocument<HTMLElement, Text, Document>(document, adaptor, {
  InputJax,
})

const visitor = new SerializedMmlVisitor()

export const convertToMathML = (
  tex: string,
  display: boolean
): string | null => {
  // TODO: set containerWidth and lineWidth for wrapping?

  const item = doc.convert(tex, {
    display,
    em: 16,
    ex: 8,
    containerWidth: 1000000,
    lineWidth: 1000000,
    scale: 1,
    end: STATE.CONVERT,
  })

  if (!item) {
    return null
  }

  // TODO: use xml-serializer to avoid adding the namespace manually?

  return visitor
    .visitTree(item)
    .replace(/^<math/, '<math xmlns="http://www.w3.org/1998/Math/MathML"')
}
