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

import { xmlSerializer } from '@manuscripts/manuscript-transform'
import { HTMLAdaptor, MinWindow } from 'mathjax-full/js/adaptors/HTMLAdaptor'
import { HTMLDocument } from 'mathjax-full/js/handlers/html/HTMLDocument'
import { HTMLMathItem } from 'mathjax-full/js/handlers/html/HTMLMathItem'
import { TeX } from 'mathjax-full/js/input/tex'
import { SVG } from 'mathjax-full/js/output/svg'
import 'mathjax-full/js/util/entities/all'

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
const InputJax = new TeX<HTMLElement, Text, Document>({})

// SVG output
const OutputJax = new SVG<HTMLElement, Text, Document>({
  fontCache: 'none', // avoid <defs> and <use xlink:href>
})

const adaptor = new ManuscriptsHTMLAdaptor((window as unknown) as MinWindow<
  HTMLElement,
  Document
>)

const doc = new HTMLDocument(document, adaptor, {
  InputJax,
  OutputJax,
})

doc.addStyleSheet()

export const typeset = (math: string, display: boolean): string | null => {
  const item = new HTMLMathItem(math, InputJax, display)
  // TODO: set containerWidth and lineWidth for wrapping?
  item.setMetrics(16, 8, 1000000, 100000, 1)
  item.compile(doc)
  item.typeset(doc)

  if (!item.typesetRoot || !item.typesetRoot.firstChild) {
    return null
  }

  return xmlSerializer.serializeToString(item.typesetRoot.firstChild)
}
