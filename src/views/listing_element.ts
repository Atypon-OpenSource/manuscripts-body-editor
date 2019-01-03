import { Figure } from '@manuscripts/manuscripts-json-schema'
import { Decoration } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { ManuscriptNode } from '../schema/types'
import { NodeViewCreator } from '../types'
import Block from './block'

class ListingElement extends Block {
  protected node: ManuscriptNode
  private container: HTMLElement
  private element: HTMLElement

  protected get elementType() {
    return 'figure'
  }

  public update(newNode: ManuscriptNode, decorations?: Decoration[]) {
    if (newNode.type.name !== this.node.type.name) return false
    if (newNode.attrs.id !== this.node.attrs.id) return false
    this.handleDecorations(decorations)
    this.node = newNode
    this.updateContents()
    return true
  }

  public deselectNode() {
    this.props.popper.destroy()
  }

  protected createElement() {
    this.element = document.createElement(this.elementType)
    this.element.className = 'block'
    this.element.setAttribute('id', this.node.attrs.id)

    this.container = document.createElement('div')
    this.container.className = 'listing-panel'
    this.container.contentEditable = 'false'
    this.element.appendChild(this.container)

    this.contentDOM = document.createElement('div')
    this.element.appendChild(this.contentDOM)

    this.dom.appendChild(this.element)
  }

  protected updateContents() {
    const { suppressCaption, containedFigureID } = this.node.attrs

    this.dom.classList.toggle('suppress-caption', suppressCaption)

    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.firstChild as Node)
    }

    const figure = this.props.getModel<Figure>(containedFigureID)

    if (figure && figure.src) {
      const img = document.createElement('img')
      img.src = figure.src
      this.container.appendChild(img)
    }
  }
}

const listingElement = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new ListingElement(props, node, view, getPos)

export default listingElement
