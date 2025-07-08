/*!
 * © 2025 Atypon Systems LLC
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

import { ImageElementNode, schema } from '@manuscripts/transform'

import {
  ExtLinkEditor,
  ExtLinkEditorProps,
} from '../components/views/ExtLinkEditor'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

export class ImageElementView extends BlockView<Trackable<ImageElementNode>> {
  public container: HTMLElement
  public extLinkEditorContainer: HTMLDivElement

  public ignoreMutation = () => true

  public createElement() {
    this.container = document.createElement('div')
    this.container.classList.add('block')
    this.dom.appendChild(this.container)

    // figure group
    this.contentDOM = document.createElement('figure')
    this.contentDOM.classList.add('figure-block')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.container.appendChild(this.contentDOM)
  }

  public updateContents() {
    super.updateContents()

    // If the node is an image element, add the external link editor
    if (this.node.type === schema.nodes.image_element) {
      this.addExternalLinkedFileEditor.call(this)
    }
  }

  private addExternalLinkedFileEditor() {
    this.extLinkEditorContainer?.remove()
    if (this.props.dispatch && this.props.theme) {
      const componentProps: ExtLinkEditorProps = {
        node: this.node,
        nodePos: this.getPos(),
        view: this.view,
        editorProps: this.props,
      }
      this.extLinkEditorContainer = ReactSubView(
        this.props,
        ExtLinkEditor,
        componentProps,
        this.node,
        this.getPos,
        this.view,
        ['ext-link-editor-container']
      )

      // Delay injection to avoid being overwritten
      requestAnimationFrame(() => {
        this.contentDOM?.appendChild(this.extLinkEditorContainer)
      })
    }
  }
}

export default createNodeView(ImageElementView)
