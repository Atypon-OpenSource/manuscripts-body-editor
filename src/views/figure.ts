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
    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.firstChild as Node)
    }

    const object =
      this.createMedia() ||
      this.createFigureImage() ||
      this.createFigurePlaceholder()

    this.container.appendChild(object)
  }

  public createMedia = () => {
    const { embedURL } = this.node.attrs

    if (embedURL) {
      const container = document.createElement('div')
      container.classList.add('figure-embed')

      const object = document.createElement('iframe')
      object.classList.add('figure-embed-object')
      object.setAttribute('src', embedURL)
      object.setAttribute('height', '100%')
      object.setAttribute('width', '100%')
      object.setAttribute('allowfullscreen', 'true')
      object.setAttribute('sandbox', 'allow-scripts allow-same-origin')
      container.appendChild(object)

      // TODO: use oEmbed to fetch information for any URL?
      // TODO: use figure image as preview/click to play?

      return container
    }
  }

  public createFigureImage = () => {
    const { src } = this.node.attrs

    if (src) {
      const element = document.createElement('img')
      element.classList.add('figure-image')
      element.src = src

      return element
    }
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
