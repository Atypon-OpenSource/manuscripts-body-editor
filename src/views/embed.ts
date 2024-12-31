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

import { EmbedNode } from '@manuscripts/transform'

import { NoPreviewMessage } from '../components/toolbar/InsertEmbedMediaDialog'
import { getOEmbedJSON, getOEmbedUrl } from '../lib/oembed'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

export class EmbedMediaView extends BlockView<Trackable<EmbedNode>> {
  private container: HTMLElement

  public ignoreMutation = () => true
  public stopEvent = () => true

  public initialise() {
    this.createDOM()
    this.createElement()
    this.updateContents()
  }

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block')
    this.container.setAttribute('id', this.node.attrs.id)
    this.dom.appendChild(this.container)

    this.contentDOM = document.createElement('div')
    this.container.appendChild(this.contentDOM)
  }

  public async updateContents() {
    super.updateContents()
    if (this.container.getAttribute('media-link') !== this.node.attrs.href) {
      this.container.setAttribute('media-link', this.node.attrs.href)
      await this.updateOEmbedPreview()
    }
  }

  private async updateOEmbedPreview() {
    const preview = document.createElement('div')
    preview.classList.add('embed-media-preview')
    preview.setAttribute('contenteditable', 'false')
    this.container.prepend(preview)

    const oEmbedUrl = await getOEmbedUrl(this.node.attrs.href, 643, 363)
    if (oEmbedUrl) {
      const oembedJSON = await getOEmbedJSON(oEmbedUrl)
      if (oembedJSON) {
        preview.innerHTML = oembedJSON.html
        return
      }
    }
    this.showUnavailableMessage(preview)
  }

  private showUnavailableMessage(preview: HTMLElement) {
    preview.appendChild(
      ReactSubView(
        this.props,
        NoPreviewMessage,
        { url: this.node.attrs.href },
        this.node,
        this.getPos,
        this.view
      )
    )
  }
}

export default createNodeView(EmbedMediaView)
