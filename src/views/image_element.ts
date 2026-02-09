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

import { ContextMenu } from '@manuscripts/style-guide'
import { FigureNode, ImageElementNode, schema } from '@manuscripts/transform'

import { deleteIcon, linkIcon } from '../icons'
import {
  addInteractionHandlers,
  createMediaPlaceholder,
  MediaType,
} from '../lib/media'
import { createPositionMenuWrapper } from '../lib/position-menu'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'
import ReactSubView from './ReactSubView'

export enum figurePositions {
  left = 'half-left',
  right = 'half-right',
  default = '',
}

export class ImageElementView extends BlockView<Trackable<ImageElementNode>> {
  public container: HTMLElement
  public subcontainer: HTMLElement
  public extLinkEditorContainer: HTMLDivElement
  private positionMenuWrapper: HTMLDivElement
  private figurePosition: string
  private isEditingExtLink = false

  public ignoreMutation = () => true

  upload = async (file: File) => {
    const result = await this.props.fileManagement.upload(file)
    if (!result) {
      return
    }
    this.setIsEditingExtLink(false)
    this.setExtLink({ extLink: result.id })
    this.updateContents()
  }

  public initialise() {
    super.initialise()
    this.upload = this.upload.bind(this)
  }

  public createDOM() {
    super.createDOM()
  }

  public createElement() {
    this.container = document.createElement('div')
    this.container.classList.add('block')
    this.dom.appendChild(this.container)

    // figure group
    this.subcontainer = document.createElement('div')
    this.subcontainer.classList.add('figure-block-group')

    this.contentDOM = document.createElement('div')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.contentDOM.classList.add('figure-block')

    this.subcontainer.appendChild(this.contentDOM)
    this.container.appendChild(this.subcontainer)
    this.addTools()
  }

  public updateContents() {
    super.updateContents()
    this.addTools()
    this.addExternalLinkedFileEditor()
  }

  protected addTools() {
    this.addPositionMenu()
  }

  protected addPositionMenu() {
    if (this.props.getCapabilities()?.editArticle) {
      // Remove existing position menu if it exists
      const existingMenu = this.container.querySelector('.position-menu')
      if (existingMenu) {
        existingMenu.remove()
      }

      const firstFigure = this.getFirstFigure()
      this.figurePosition = firstFigure?.attrs.type || figurePositions.default

      this.positionMenuWrapper = createPositionMenuWrapper(
        this.figurePosition,
        this.showPositionMenu,
        this.props
      )

      this.container.prepend(this.positionMenuWrapper)
    }
  }

  /**
   * Gets the first figure node from the element.
   * Optimized for image_element (direct access) vs figure_element (loop through all).
   * @returns The first figure node or null if no figure exists
   */
  private getFirstFigure(): FigureNode | null {
    // Optimize for image_element which only has one figure
    if (this.node.type === schema.nodes.image_element) {
      // Direct access to the single figure in image_element
      const figureNode = this.node.firstChild
      if (figureNode && figureNode.type === schema.nodes.figure) {
        return figureNode as FigureNode
      }
      return null
    } else {
      // For figure_element, find the first figure
      let firstFigure: FigureNode | null = null
      this.node.forEach((node) => {
        if (node.type === schema.nodes.figure && !firstFigure) {
          firstFigure = node as FigureNode
        }
      })
      return firstFigure
    }
  }

  /**
   * Gets all figure nodes and their positions from the element.
   * Optimized for image_element (direct access) vs figure_element (loop through all).
   * @returns Array of figure nodes with their positions
   */
  private getAllFigures() {
    const figures: Array<{ node: FigureNode; pos: number }> = []
    let pos = this.getPos() + 1

    if (this.node.type === schema.nodes.image_element) {
      const figureNode = this.node.firstChild
      if (figureNode && figureNode.type === schema.nodes.figure) {
        figures.push({ node: figureNode as FigureNode, pos })
      }
    } else {
      this.node.forEach((node) => {
        if (node.type === schema.nodes.figure) {
          figures.push({ node: node as FigureNode, pos })
        }
        pos += node.nodeSize
      })
    }

    return figures
  }

  private showPositionMenu = () => {
    const firstFigure = this.getFirstFigure()
    if (!firstFigure) {
      return
    }

    this.props.popper.destroy()

    const options = [
      {
        label: 'Left',
        action: () => {
          this.props.popper.destroy()
          this.updateAllFiguresPosition(figurePositions.left)
        },
        icon: 'ImageLeft',
        selected: this.figurePosition === figurePositions.left,
      },
      {
        label: 'Default',
        action: () => {
          this.props.popper.destroy()
          this.updateAllFiguresPosition(figurePositions.default)
        },
        icon: 'ImageDefault',
        selected: !this.figurePosition,
      },
      {
        label: 'Right',
        action: () => {
          this.props.popper.destroy()
          this.updateAllFiguresPosition(figurePositions.right)
        },
        icon: 'ImageRight',
        selected: this.figurePosition === figurePositions.right,
      },
    ]

    const componentProps = {
      actions: options,
    }

    this.props.popper.show(
      this.positionMenuWrapper,
      ReactSubView(
        this.props,
        ContextMenu,
        componentProps,
        this.node,
        this.getPos,
        this.view,
        ['context-menu', 'position-menu']
      ),
      'left',
      false
    )
  }

  /**
   * Updates the position type for all figures within this element.
   * This affects all figures in figure_element, or the single figure in image_element.
   * @param position - The new position type ('half-left', 'half-right', or '')
   */
  private updateAllFiguresPosition(position: string) {
    const figures = this.getAllFigures()
    const { tr } = this.view.state

    figures.forEach(({ node, pos }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        type: position,
      })
    })

    this.view.dispatch(tr)
    this.figurePosition = position
  }

  // external link editor
  private removeExtLink = () => {
    this.setExtLink({ extLink: '' })
  }

  private setExtLink = (newAttrs: { extLink: string }) => {
    this.setIsEditingExtLink(false)
    const { tr } = this.view.state
    const pos = this.getPos()
    tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      ...newAttrs,
    })

    this.view.dispatch(tr)
  }

  private setIsEditingExtLink = (val: boolean) => {
    this.isEditingExtLink = val
  }

  private createDnDPlaceholder() {
    const can = this.props.getCapabilities()
    const label = document.createElement('div')
    label.classList.add('accessibility_element_label')
    label.innerText = 'Link'
    const container = document.createElement('div')
    container.classList.add('ext-link-editor-placeholder-container')

    const placeholder = createMediaPlaceholder(
      MediaType.ExternalLink,
      this.view,
      this.getPos,
      this.props
    )

    const closeButton = document.createElement('button')
    closeButton.classList.add('close-button')
    closeButton.setAttribute('aria-label', 'Close')
    closeButton.addEventListener('click', () => {
      this.setIsEditingExtLink(false)
      this.updateContents()
    })

    container.append(placeholder, closeButton)
    this.extLinkEditorContainer.append(label, container)
    if (can.uploadFile) {
      addInteractionHandlers(placeholder, this.upload, '*/*')
    }
  }

  private createAddLinkButton() {
    const button = document.createElement('div')
    button.innerHTML = linkIcon
    const buttonText = document.createElement('span')
    buttonText.textContent = 'Add link'
    button.appendChild(buttonText)
    button.setAttribute('aria-label', 'Add linked file')
    button.classList.add('icon-button')
    button.addEventListener('click', () => {
      this.setIsEditingExtLink(true)
      this.updateContents()
    })
    this.extLinkEditorContainer.appendChild(button)
  }

  private createLinkedFile() {
    const extLink = this.node.attrs.extLink
    const files = this.props.getFiles()
    const file = extLink ? files.find((f) => f.id === extLink) : undefined

    const fileName = file ? `${file.name.trim()}` : 'File does not exist.'
    const div = document.createElement('div')
    div.classList.add('linked-file-info')
    div.innerHTML = `<p>${linkIcon} <span>${fileName}</span></p>`

    const removeButton = document.createElement('button')
    removeButton.classList.add('icon-button', 'remove-button')
    removeButton.setAttribute('aria-label', 'Remove link')
    removeButton.innerHTML = deleteIcon
    removeButton.addEventListener('click', () => {
      this.isEditingExtLink = false
      this.removeExtLink()
    })

    div.appendChild(removeButton)
    this.extLinkEditorContainer.appendChild(div)
  }

  private addExternalLinkedFileEditor() {
    if (this.node.type === schema.nodes.image_element) {
      this.extLinkEditorContainer = this.container.querySelector(
        '.ext-link-editor-container'
      ) as HTMLDivElement
      if (this.extLinkEditorContainer) {
        this.extLinkEditorContainer.innerHTML = ''
      } else {
        this.extLinkEditorContainer = document.createElement('div')
        this.extLinkEditorContainer.contentEditable = 'false'
        this.extLinkEditorContainer.classList.add('ext-link-editor-container')
      }
      // add link button
      if (!this.isEditingExtLink && !this.node.attrs.extLink) {
        this.createAddLinkButton()
      }
      //dnd placeholder
      if (this.isEditingExtLink && !this.node.attrs.extLink) {
        this.createDnDPlaceholder()
      }
      // linked file exists
      if (this.node.attrs.extLink) {
        this.createLinkedFile()
      }

      this.subcontainer.appendChild(this.extLinkEditorContainer)
    }
  }
}

export default createNodeView(ImageElementView)
