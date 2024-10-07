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

import { FigureElementNode, FigureNode, schema } from '@manuscripts/transform'

import {
  FigureElementOptions,
  FigureElementOptionsProps,
} from '../components/views/FigureDropdown'
import { FileAttachment, groupFiles } from '../lib/files'
import { getMatchingChild } from '../lib/utils'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'
import { figureUploader } from './figure_uploader'
import ReactSubView from './ReactSubView'

export class FigureElementView extends BlockView<Trackable<FigureElementNode>> {
  private container: HTMLElement
  private reactTools: HTMLElement

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

    if (this.node.attrs.dataTracked?.length) {
      const change = this.node.attrs.dataTracked[0]
      this.dom.setAttribute('data-track-status', change.status)
      this.dom.setAttribute('data-track-op', change.operation)
    } else {
      this.dom.removeAttribute('data-track-status')
      this.dom.removeAttribute('data-track-op')
    }
    const handleNewFile = (): boolean => {
      let figureUploaded = false
      this.node.content.forEach((file) => {
        if (file.attrs.src) {
          figureUploaded = true
        }
      })
      return figureUploaded
    }
    this.contentDOM.setAttribute('data-figure-style', figureStyle)
    this.contentDOM.setAttribute('data-figure-layout', figureLayout)
    this.contentDOM.setAttribute('data-alignment', alignment || '')

    if (sizeFraction > 1) {
      // fit to page width
      this.contentDOM.style.width = '100%'
      this.contentDOM.style.padding = '0 !important'
    } else {
      // fit to margin
      this.contentDOM.style.width = `${(sizeFraction || 1) * 100}%`
    }

    this.container.classList.toggle('fit-to-page', sizeFraction === 2)

    const can = this.props.getCapabilities()
    let handleUpload = () => {
      //noop
    }
    const handleAdd = async (file: FileAttachment) => {
      const {
        state: { tr, schema, selection },
        dispatch,
      } = this.view

      const src = file.id
      const figure = getMatchingChild(
        this.node,
        (node) => node.type === schema.nodes.figure
      )

      if (figure?.attrs.src) {
        // If there is already a figure inside, we then create a new one. This is product logic.
        const figure = schema.nodes.figure.createAndFill(
          {
            src,
          },
          []
        ) as FigureNode

        let position = 0
        this.node.forEach((node, pos) => {
          if (node.type === schema.nodes.figure) {
            position = pos + node.nodeSize
          }
        })

        dispatch(tr.insert(this.getPos() + position + 1, figure))
      } else if (figure) {
        tr.setNodeMarkup(this.getPos() + 1, undefined, {
          ...figure.attrs,
          src,
        }).setSelection(selection.map(tr.doc, tr.mapping))

        dispatch(tr)
      }

      this.deleteSupplementNode(file)
    }

    if (can.uploadFile) {
      const upload = async (file: File) => {
        const result = await this.props.fileManagement.upload(file)
        await handleAdd(result)
      }

      handleUpload = figureUploader(upload)
    }
    if (this.props.dispatch && this.props.theme) {
      const files = this.props.getFiles()
      const doc = this.view.state.doc
      const componentProps: FigureElementOptionsProps = {
        can: can,
        files: groupFiles(doc, files),
        onUpload: handleUpload,
        onAdd: handleAdd,
        onAddNewFile: handleNewFile,
      }
      this.reactTools = ReactSubView(
        this.props,
        FigureElementOptions,
        componentProps,
        this.node,
        this.getPos,
        this.view
      )
      this.reactTools?.remove()
      this.dom.insertBefore(this.reactTools, this.dom.firstChild)
    }
  }

  private deleteSupplementNode(file: FileAttachment) {
    const tr = this.view.state.tr

    this.view.state.doc.descendants((node, pos) => {
      if (
        node.type === schema.nodes.supplement &&
        node.attrs.href === file.id
      ) {
        tr.delete(pos, pos + node.nodeSize)
      }
    })
    this.view.dispatch(tr)
  }
}

export default createNodeView(FigureElementView)
