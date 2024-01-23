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

import { ManuscriptNodeView } from '@manuscripts/transform'

import { sanitize } from '../lib/dompurify'
import { convertMathMLToSVG } from '../lib/mathml-to-svg'
import { convertTeXToSVG } from '../lib/tex-to-svg'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class EquationView<PropsType extends BaseNodeProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('equation')
    this.dom.setAttribute('id', this.node.attrs.id)
  }

  public updateContents = () => {
    const { contents, format } = this.node.attrs

    //Should this be represented in another way other than SVG?
    const svgContent =
      format === 'tex'
        ? convertTeXToSVG(contents, true)
        : convertMathMLToSVG(contents, true)

    while (this.dom.hasChildNodes()) {
      this.dom.removeChild(this.dom.firstChild as ChildNode)
    }

    if (svgContent) {
      const fragment = sanitize(svgContent, {
        USE_PROFILES: { svg: true },
      })
      this.dom.appendChild(fragment)
    } else {
      const placeholder = document.createElement('div')
      placeholder.className = 'equation-placeholder'
      placeholder.textContent = '<Equation>'

      this.dom.appendChild(placeholder)
    }
  }

  public ignoreMutation = () => true
}

export default createNodeView(EquationView)
