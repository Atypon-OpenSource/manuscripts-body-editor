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

import { FigureNode } from '@manuscripts/transform'

import {
  FilesDropdown,
  FilesDropdownProps,
} from '../components/views/FilesDropdown'
import { createOnUploadHandler } from '../lib/figure-file-upload'
import { getMatchingChild, setNodeAttrs } from '../lib/utils'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import { FigureProps } from './FigureComponent'
import ReactSubView from './ReactSubView'

export class FigureElementView extends BlockView<
  EditableBlockProps & FigureProps
> {
  private container: HTMLElement
  private reactTools: HTMLElement
  public envokeFileInput: () => void

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

  public isEmptyFigure = () => {
    const figure = getMatchingChild(
      this.node,
      (node) => node.type === node.type.schema.nodes.figure
    )

    return !figure?.attrs.src
  }

  public addAttachmentSrc = (publicUrl: string) => {
    const {
      state: { tr, schema },
      dispatch,
    } = this.view

    if (!this.isEmptyFigure()) {
      // If there is already a figure inside, we then create a new one. This is product logic.
      const figure = schema.nodes.figure.createAndFill(
        {
          src: publicUrl,
        },
        []
      ) as FigureNode

      let node_position = 0
      this.node.forEach((node, pos) => {
        if (node.type === node.type.schema.nodes.figure) {
          node_position = pos + node.nodeSize
        }
      })

      dispatch(tr.insert(this.getPos() + node_position + 1, figure))
    } else {
      const figure = getMatchingChild(
        this.node,
        (node) => node.type === node.type.schema.nodes.figure
      )
      setNodeAttrs(
        figure,
        { node: this.node, view: this.view, getPos: this.getPos },
        dispatch
      )({
        src: publicUrl,
      })
    }
  }

  public updateContents = () => {
    const { figureStyle, figureLayout, alignment, sizeFraction } =
      this.node.attrs

    if (!this.contentDOM) {
      throw new Error('No contentDOM')
    }

    if (this.node.attrs.dataTracked?.length) {
      this.dom.setAttribute(
        'data-track-status',
        this.node.attrs.dataTracked[0].status
      )
      this.dom.setAttribute(
        'data-track-op',
        this.node.attrs.dataTracked[0].operation
      )
    } else {
      this.dom.removeAttribute('data-track-status')
      this.dom.removeAttribute('data-track-type')
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

    const capabilities = this.props.getCapabilities()

    if (capabilities.editArticle && capabilities.uploadFile) {
      const uploadAttachmentHandler = createOnUploadHandler(
        this.props.uploadAttachment,
        this.addAttachmentSrc
      )
      const input = document.createElement('input')
      input.accept = 'image/*'
      input.type = 'file'
      input.addEventListener('change', uploadAttachmentHandler)

      this.envokeFileInput = () => {
        input.click()
      }
    }

    if (this.props.dispatch && this.props.theme) {
      const componentProps: FilesDropdownProps = {
        getAttachments: this.props.getAttachments,
        modelMap: this.props.modelMap,
        onUploadClick: this.envokeFileInput,
        mediaAlternativesEnabled: this.props.mediaAlternativesEnabled,
        addFigureExFileRef: this.addAttachmentSrc,
        canReplaceFile: capabilities.replaceFile,
        canUploadFile: capabilities.uploadFile,
        getDoc: this.props.getDoc,
      }
      this.reactTools = ReactSubView(
        this.props,
        FilesDropdown,
        componentProps,
        this.node,
        this.getPos,
        this.view
      )
    }
    if (this.reactTools) {
      this.dom.insertBefore(this.reactTools, this.dom.firstChild)
    }
  }
}

export default createNodeView(FigureElementView)
