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

import {
  FigureNode,
  isInGraphicalAbstractSection,
} from '@manuscripts/manuscript-transform'

import {
  FilesDropdown,
  FilesDropdownProps,
} from '../components/views/FilesDropdown'
import { ExternalFileRef } from '../lib/external-files'
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

    const imageExternalFile = figure?.attrs.externalFileReferences?.find(
      (file: ExternalFileRef) => file && file.kind === 'imageRepresentation'
    ) || { url: '' }

    return imageExternalFile?.url.trim().length < 1
  }

  public addFigureExFileRef = (
    relation: string,
    publicUrl: string,
    attachmentId: string
  ) => {
    const {
      state: { tr, schema },
      dispatch,
    } = this.view

    if (!this.isEmptyFigure()) {
      const figure = schema.nodes.figure.createAndFill(
        {
          externalFileReferences: [
            {
              url: `attachment:${attachmentId}`,
              kind: 'imageRepresentation',
            },
          ],
          src: publicUrl,
        },
        []
      ) as FigureNode

      let node_position = 0
      this.node.forEach((node, pos) => {
        if (node.type === node.type.schema.nodes.figcaption) {
          node_position = pos
        }
      })

      dispatch(tr.insert(this.getPos() + node_position, figure))
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
        externalFileReferences: [
          {
            url: `attachment:${attachmentId}`,
            kind: 'imageRepresentation',
          },
        ],
      })
    }
  }

  private isInGraphicalAbstract = () => {
    const resolvedPos = this.view.state.doc.resolve(this.getPos())
    return isInGraphicalAbstractSection(resolvedPos)
  }

  public updateContents = () => {
    const {
      suppressCaption,
      suppressTitle,
      figureStyle,
      figureLayout,
      alignment,
      sizeFraction,
    } = this.node.attrs

    this.dom.classList.toggle('suppress-caption', suppressCaption)
    this.dom.classList.toggle(
      'suppress-title',
      suppressTitle === undefined ? true : suppressTitle
    )

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

    if (
      this.props.capabilities?.editArticle &&
      this.props.capabilities?.uploadFile
    ) {
      const uploadAttachmentHandler = createOnUploadHandler(
        this.props.uploadAttachment,
        this.isInGraphicalAbstract() ? 'graphical-abstract-image' : 'figure',
        'imageRepresentation',
        this.addFigureExFileRef
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
        externalFiles: this.props.externalFiles,
        modelMap: this.props.modelMap,
        onUploadClick: this.envokeFileInput,
        mediaAlternativesEnabled: this.props.mediaAlternativesEnabled,
        addFigureExFileRef: this.addFigureExFileRef,
        canReplaceFile: this.props.capabilities?.replaceFile,
        canUploadFile: this.props.capabilities?.uploadFile,
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
