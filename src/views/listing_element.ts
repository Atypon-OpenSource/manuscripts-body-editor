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

    // the figure
    this.container = document.createElement('div')
    this.container.className = 'listing-panel'
    this.container.contentEditable = 'false'
    this.element.appendChild(this.container)

    // the expander button
    this.element.appendChild(this.createExpander())

    // the code listing and caption
    this.contentDOM = document.createElement('div')
    this.contentDOM.className = 'listing-element-content'
    this.element.appendChild(this.contentDOM)

    this.dom.appendChild(this.element)
  }

  protected updateContents() {
    const { suppressCaption, containedFigureID, isExpanded } = this.node.attrs

    this.dom.classList.toggle('suppress-caption', suppressCaption)
    this.dom.classList.toggle('expanded', isExpanded)

    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.firstChild as Node)
    }

    const figure = this.props.getModel<Figure>(containedFigureID)

    if (figure && figure.src) {
      const img = document.createElement('img')
      img.src = figure.src
      this.container.appendChild(img)

      this.dom.classList.toggle('has-figure', true)
    } else {
      this.dom.classList.toggle('has-figure', false)
    }
  }

  private createExpander() {
    const expander = document.createElement('button')
    expander.className = 'expander'

    expander.innerHTML = `<svg width="20" height="20">
        <g transform="matrix(1 0 0 -1 0 20)" fill="none" fillRule="evenodd">
          <circle stroke="#D8D8D8" cx="10" cy="10" r="9" />
          <path
            stroke="#7fb5d5"
            strokeWidth="2"
            strokeLinecap="round"
            d="M6.505 10.974l3.548-3 3.652 2.96"
          />
        </g>
      </svg>`

    expander.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()

      const tr = this.view.state.tr.setNodeMarkup(this.getPos(), undefined, {
        ...this.node.attrs,
        isExpanded: !this.node.attrs.isExpanded,
      })

      this.view.dispatch(tr)
    })

    return expander
  }
}

const listingElement = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new ListingElement(props, node, view, getPos)

export default listingElement
