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

import { ViewerProps } from '../components/Viewer'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class FigureElementView<PropsType extends ViewerProps> extends BlockView<
  PropsType
> {
  public ignoreMutation = () => true

  public createElement = () => {
    const container = document.createElement('figure-container')
    container.className = 'block'
    this.dom.appendChild(container)

    // figure group
    this.contentDOM = document.createElement('figure')
    this.contentDOM.classList.add('figure-block')
    this.contentDOM.setAttribute('id', this.node.attrs.id)

    container.appendChild(this.contentDOM)
  }

  public updateContents = () => {
    const {
      suppressCaption,
      figureStyle,
      figureLayout,
      sizeFraction,
    } = this.node.attrs

    this.dom.classList.toggle('suppress-caption', suppressCaption)

    this.contentDOM!.setAttribute('data-figure-style', figureStyle)

    this.contentDOM!.setAttribute('data-figure-layout', figureLayout)

    this.contentDOM!.setAttribute('data-size-fraction', sizeFraction)

    if (sizeFraction) {
      this.contentDOM!.style.width = `${sizeFraction * 100}%`
    }
  }
}

export default createNodeView(FigureElementView)
