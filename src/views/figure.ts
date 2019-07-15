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

import { ManuscriptNodeView } from '@manuscripts/manuscript-transform'
import { ViewerProps } from '../components/Viewer'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class FigureView<PropsType extends ViewerProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView {
  protected container: HTMLElement

  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public ignoreMutation = () => true

  public updateContents = () => {
    const { src } = this.node.attrs

    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.firstChild as Node)
    }

    const img = src
      ? this.createFigureImage(src)
      : this.createFigurePlaceholder()

    this.container.appendChild(img)
  }

  public createFigureImage = (src: string) => {
    const element = document.createElement('img')
    element.classList.add('figure-image')
    element.src = src

    return element
  }

  public createFigurePlaceholder = () => {
    const element = document.createElement('div')
    element.classList.add('figure')
    element.classList.add('placeholder')

    const instructions = document.createElement('div')
    instructions.textContent = 'No image here yet…'
    element.appendChild(instructions)

    return element
  }

  // TODO: load/subscribe to the figure style object from the database and use it here?
  protected createDOM = () => {
    this.dom = document.createElement('figure')
    this.dom.setAttribute('id', this.node.attrs.id)

    this.container = document.createElement('div')
    this.container.className = 'figure'
    this.container.contentEditable = 'false'
    this.dom.appendChild(this.container)

    this.contentDOM = document.createElement('div') // TODO: figcaption?
    this.contentDOM.className = 'figure-caption'
    this.contentDOM.setAttribute('tabindex', '1337') // allow focus in this node
    this.dom.appendChild(this.contentDOM)
  }
}

export default createNodeView(FigureView)
