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
import { FileSectionItem } from '@manuscripts/style-guide'
import { Node } from 'prosemirror-model'

import { ExternalFileRef } from '../lib/external-files'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import { FigureProps } from './FigureComponent'
import {
  AttachableFilesDropdown,
  isFigureNode,
  isTableNode,
} from './FigureElement'
import ReactSubView from './ReactSubView'

export class TableElementView extends BlockView<
  EditableBlockProps & FigureProps
> {
  private reactTools: HTMLElement
  private reactBottomTools: HTMLElement
  public elementType = 'figure'

  public createElement = () => {
    this.contentDOM = document.createElement('figure')
    this.contentDOM.classList.add('block')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.dom.appendChild(this.contentDOM)
  }

  public getFigure = () => {
    let figure: Node | undefined
    this.node.content.descendants((node) => {
      if (isTableNode(node) || isFigureNode(node)) {
        figure = node
      }
    })
    return figure
  }

  public createReactViews = () => {
    const figure = this.getFigure()
    const dataset =
      figure &&
      figure.attrs?.externalFileReferences?.find(
        (file: ExternalFileRef) => file.kind === 'dataset'
      )

    if (figure && dataset?.ref) {
      const props = {
        submissionId: this.props.submissionId,
        title:
          dataset.ref.filename ||
          dataset.ref.displayName ||
          dataset.ref.filename,
        handleChangeDesignation: this.props.updateDesignation,
        externalFile: dataset.ref,
        showDesignationActions: true,
      }
      this.reactBottomTools = ReactSubView(
        this.props,
        FileSectionItem,
        props,
        this.node,
        this.getPos,
        this.view,
        'tools-bottom tools-static'
      )

      if (this.reactBottomTools) {
        this.dom.appendChild(this.reactBottomTools)
      }
    }

    if (
      this.props.mediaAlternativesEnabled &&
      this.props.capabilities?.changeDesignation &&
      this.props.getAttachments()
    ) {
      const addFigureExFileRef = () => {
        // This is not active implementation but maybe used later on
        //   if (figure) {
        //     const newAttrs: Node['attrs'] = {
        //       externalFileReferences: addExternalFileRef(
        //         figure?.attrs.externalFileReferences,
        //         attachmentId,
        //         relation
        //       ),
        //     }
        //     if (relation == 'imageRepresentation') {
        //       newAttrs.src = publicUrl
        //     }
        //     setNodeAttrs(
        //       figure,
        //       { getPos: this.getPos, node: this.node, view: this.view },
        //       this.view.dispatch
        //     )(newAttrs)
        //   }
        console.error(
          'Not supported at the moment. Requires reimplementation withtout external file references'
        )
      }
      const componentProps = {
        files: this.props.getAttachments(),
        handleSelectedFile: () => null,
        uploadAttachment: this.props.uploadAttachment,
        addFigureExFileRef: addFigureExFileRef,
      }
      this.reactTools = ReactSubView(
        this.props,
        AttachableFilesDropdown,
        componentProps,
        this.node,
        this.getPos,
        this.view
      )

      if (this.reactTools) {
        this.dom.appendChild(this.reactTools)
      }
    }
  }

  public updateContents = () => {
    const {
      suppressCaption,
      suppressTitle,
      suppressHeader,
      suppressFooter,
    } = this.node.attrs

    this.dom.classList.toggle('suppress-caption', suppressCaption)
    this.dom.classList.toggle(
      'suppress-title',
      suppressTitle === undefined ? true : suppressTitle
    )

    this.dom.classList.toggle('suppress-header', suppressHeader)
    this.dom.classList.toggle('suppress-footer', suppressFooter)

    if (this.contentDOM) {
      this.contentDOM.setAttribute(
        'data-paragraph-style',
        this.node.attrs.paragraphStyle
      )
      this.contentDOM.setAttribute(
        'data-table-style',
        this.node.attrs.tableStyle
      )
    }
  }
}

export default createNodeView(TableElementView)
