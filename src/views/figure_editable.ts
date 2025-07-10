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

import { schema } from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'

import {
  addInteractionHandlers,
  createFileHandlers,
  createFileUploader,
  createMediaPlaceholder,
  createPositionMenuWrapper,
  createReactTools,
  createUnsupportedFormat,
  showPositionMenu,
} from '../lib/media'
import { isDeleted } from '../lib/track-changes-utils'
import { createEditableNodeView } from './creators'
import { FigureView } from './figure'

export enum figurePositions {
  left = 'half-left',
  right = 'half-right',
  default = '',
}

export class FigureEditableView extends FigureView {
  public reactTools: HTMLDivElement | null = null
  positionMenuWrapper: HTMLDivElement
  figurePosition: string

  public initialise() {
    this.upload = this.upload.bind(this)
    this.createDOM()
    this.updateContents()
  }

  upload = async (file: File) => {
    const result = await this.props.fileManagement.upload(file)
    this.setSrc(result.id)
  }

  public updateContents() {
    super.updateContents()

    const src = this.node.attrs.src
    const files = this.props.getFiles()
    const file = src && files.filter((f) => f.id === src)[0]
    this.figurePosition = this.node.attrs.type

    this.container.innerHTML = ''

    const can = this.props.getCapabilities()

    const link = file && this.props.fileManagement.previewLink(file)
    const img = link
      ? this.createImg(link)
      : file
      ? this.createUnsupportedFormat(file.name)
      : this.createPlaceholder()

    if (can.uploadFile && !isDeleted(this.node)) {
      addInteractionHandlers(img, this.upload, 'image/*')
    }

    this.container.innerHTML = ''
    this.container.appendChild(img)

    this.addTools()
  }

  protected addTools() {
    this.manageReactTools()
    this.container.appendChild(this.createPositionMenuWrapper())
  }

  private manageReactTools() {
    this.reactTools?.remove()

    const handlers = createFileHandlers(
      this.node,
      this.view,
      this.getPos,
      this.props,
      this.setSrc
    )

    const can = this.props.getCapabilities()
    if (can.uploadFile) {
      handlers.handleUpload = createFileUploader(this.upload, 'image/*')
    }

    if (can.detachFile) {
      // Helper function to count non-deleted figures in current figure element
      const countFigures = () => {
        const element = findParentNodeOfTypeClosestToPos(
          this.view.state.doc.resolve(this.getPos()),
          schema.nodes.figure_element
        )
        let count = 0
        element?.node.descendants((node) => {
          if (node.type === schema.nodes.figure && !isDeleted(node)) {
            count++
          }
        })
        return count
      }

      const figureCount = countFigures()

      handlers.handleDelete =
        figureCount > 1
          ? () => {
              const currentCount = countFigures()
              const pos = this.getPos()
              if (currentCount <= 1) {
                // prevent deletion if only one figure remains
                return
              }
              const tr = this.view.state.tr
              tr.delete(pos, pos + this.node.nodeSize)
              this.view.dispatch(tr)
            }
          : undefined
    }

    this.reactTools = createReactTools(
      this.node,
      this.view,
      this.getPos,
      this.props,
      handlers
    )

    if (this.reactTools) {
      this.dom.insertBefore(this.reactTools, this.dom.firstChild)
    }
  }

  protected setSrc = (src: string) => {
    const { tr } = this.view.state
    const pos = this.getPos()
    tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      src: src,
    })
    tr.setSelection(NodeSelection.create(tr.doc, pos))
    this.view.dispatch(tr)
  }

  private createUnsupportedFormat = (name: string) => {
    return createUnsupportedFormat(
      name,
      this.props.getCapabilities().editArticle
    )
  }

  protected createImg = (src: string) => {
    const img = document.createElement('img')
    img.classList.add('figure-image')
    img.src = src
    return img
  }

  protected createPlaceholder = () => {
    return createMediaPlaceholder('figure')
  }

  createPositionMenuWrapper = () => {
    this.positionMenuWrapper = createPositionMenuWrapper(
      this.figurePosition,
      this.showPositionMenu,
      this.props
    )
    return this.positionMenuWrapper
  }

  showPositionMenu = () => {
    showPositionMenu(
      schema.nodes.figure,
      this.node,
      this.figurePosition,
      this.positionMenuWrapper,
      this.view,
      this.getPos,
      this.props
    )
  }
}

export default createEditableNodeView(FigureEditableView)
