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

import { xmlSerializer } from '@manuscripts/transform'
import { HTMLAdaptor } from 'mathjax-full/js/adaptors/HTMLAdaptor'
import { HTMLDocument } from 'mathjax-full/js/handlers/html/HTMLDocument'
import { TeX } from 'mathjax-full/js/input/tex'
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages'
import { SVG } from 'mathjax-full/js/output/svg'

export const packages = AllPackages.filter(
  (name) => name !== 'html' && name !== 'bussproofs'
)

// @ts-ignore for MinHTMLElement nodeValue compatibility
class ManuscriptsHTMLAdaptor extends HTMLAdaptor<HTMLElement, Text, Document> {
  // CustomHTMLAdaptor subclasses HTMLAdaptor only to avoid setting an "xmlns" attribute
  public setAttribute(
    node: HTMLElement,
    name: string,
    value: string,
    ns?: string
  ) {
    if (name !== 'xmlns') {
      ns ? node.setAttributeNS(ns, name, value) : node.setAttribute(name, value)
    }
  }
}

// TeX input
const InputJax = new TeX<HTMLElement, Text, Document>({
  packages,
})

// SVG output
const OutputJax = new SVG<HTMLElement, Text, Document>({
  fontCache: 'none', // avoid <defs> and <use xlink:href>
})

const adaptor = new ManuscriptsHTMLAdaptor(window)

const doc = new HTMLDocument<HTMLElement, Text, Document>(document, adaptor, {
  InputJax,
  OutputJax,
})

doc.addStyleSheet()

export const convertTeXToSVG = (
  tex: string,
  display: boolean
): string | null => {
  const item = doc.convert(tex, {
    display,
    em: 16,
    ex: 8,
    containerWidth: 1000000,
    lineWidth: 1000000,
    scale: 1,
  })

  if (!item || !item.firstChild) {
    return null
  }

  return xmlSerializer.serializeToString(item.firstChild)
}
