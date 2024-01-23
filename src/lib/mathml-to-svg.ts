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
import { MmlFactory } from 'mathjax-full/js/core/MmlTree/MmlFactory'
import { MmlNodeClass } from 'mathjax-full/js/core/MmlTree/MmlNode'
import { PropertyList } from 'mathjax-full/js/core/Tree/Node'
import { HTMLDocument } from 'mathjax-full/js/handlers/html/HTMLDocument'
import { MathML } from 'mathjax-full/js/input/mathml'
import { SVG } from 'mathjax-full/js/output/svg'

class ManuscriptsMmlFactory extends MmlFactory {
  constructor() {
    super()
    // @ts-ignore
    this.nodeMap.set('image', this.nodeMap.get('none'))
  }
  // @ts-ignore
  public create(
    kind: string,
    properties: PropertyList = {},
    children: MmlNodeClass[] = []
  ) {
    if (kind === 'image') {
      return this.node['none'](properties, children)
    }
    return this.node[kind](properties, children)
  }
}

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
const InputJax = new MathML<HTMLElement, Text, Document>()

// SVG output
const OutputJax = new SVG<HTMLElement, Text, Document>({
  fontCache: 'none', // avoid <defs> and <use xlink:href>
})

const adaptor = new ManuscriptsHTMLAdaptor(window)

const doc = new HTMLDocument<HTMLElement, Text, Document>(document, adaptor, {
  InputJax,
  OutputJax,
  MmlFactory: new ManuscriptsMmlFactory(),
})

doc.addStyleSheet()

export const convertMathMLToSVG = (
  mathml: string,
  display: boolean
): string | null => {
  const item = doc.convert(mathml, {
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
