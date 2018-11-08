import { EditorProps } from '../components/Editor'
import { placeholderContent } from '../lib/placeholder'
import { NodeViewCreator } from '../types'
import Block from './block'

class PlaceholderElement extends Block {
  private element: HTMLElement

  protected get elementType() {
    return 'div'
  }

  protected createElement() {
    this.element = document.createElement(this.elementType)
    this.element.className = 'block'
    this.element.setAttribute('id', this.node.attrs.id)
    this.dom.appendChild(this.element)

    const content = document.createElement('div')
    content.className = 'placeholder-item'
    content.innerHTML = placeholderContent(
      'An element',
      'support@manuscriptsapp.com'
    )
    this.element.appendChild(content)
  }

  protected updateContents() {
    // empty
  }
}

const placeholderElement = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new PlaceholderElement(props, node, view, getPos)

export default placeholderElement
