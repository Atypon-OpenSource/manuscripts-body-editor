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

import { sanitize } from 'dompurify'
import { ViewerProps } from '../components/Viewer'
import BlockView from './block_view'
import { createNodeView } from './creators'

const isLinkElement = (element: HTMLElement): element is HTMLAnchorElement =>
  element.nodeName === 'A'

export class BibliographyElementBlockView<
  PropsType extends ViewerProps
> extends BlockView<PropsType> {
  private element: HTMLElement

  public stopEvent = () => true

  public ignoreMutation = () => true

  public updateContents = () => {
    if (
      this.decorations &&
      this.decorations.find(decoration => decoration.spec.missing)
    ) {
      this.element.innerHTML = ''

      this.element.removeAttribute('data-paragraph-style')
    } else {
      try {
        this.element.innerHTML = sanitize(this.node.attrs.contents)
      } catch (e) {
        console.error(e) // tslint:disable-line:no-console
        // TODO: improve the UI for presenting offline/import errors
        window.alert(
          'There was an error loading the HTML purifier, please reload to try again'
        )
      }

      this.element.setAttribute(
        'data-paragraph-style',
        this.node.attrs.paragraphStyle
      )
    }
  }

  public createElement = () => {
    this.element = document.createElement('div')
    this.element.className = 'block'
    this.element.setAttribute('id', this.node.attrs.id)
    this.dom.appendChild(this.element)

    this.element.addEventListener('click', event => {
      const element = event.target as HTMLElement

      if (isLinkElement(element)) {
        event.preventDefault()

        window.open(element.href, '_blank', 'noopener')
      }
    })
  }
}

export default createNodeView(BibliographyElementBlockView)
