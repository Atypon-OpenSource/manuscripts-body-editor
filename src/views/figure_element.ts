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

import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class FigureElementView<
  PropsType extends BaseNodeProps
> extends BlockView<PropsType> {
  private container: HTMLElement

  public ignoreMutation = () => true

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block')
    this.dom.appendChild(this.container)

    // figure group
    this.contentDOM = document.createElement('figure')
    this.contentDOM.classList.add('figure-block')
    this.contentDOM.setAttribute('id', this.node.attrs.id)

    this.container.appendChild(this.contentDOM)
  }

  public updateContents = () => {
    const { figureStyle, figureLayout, alignment, sizeFraction } =
      this.node.attrs

    if (!this.contentDOM) {
      throw new Error('No contentDOM')
    }

    this.contentDOM.setAttribute('data-figure-style', figureStyle)
    this.contentDOM.setAttribute('data-figure-layout', figureLayout)
    this.contentDOM.setAttribute('data-alignment', alignment)

    if (sizeFraction > 1) {
      // fit to page width
      this.contentDOM.style.width = '100%'
      this.contentDOM.style.padding = '0 !important'
    } else {
      // fit to margin
      this.contentDOM.style.width = `${(sizeFraction || 1) * 100}%`
    }

    this.container.classList.toggle('fit-to-page', sizeFraction === 2)
  }
}

export default createNodeView(FigureElementView)
