import { sanitize } from 'dompurify'
import { EditorProps } from '../components/Editor'
import { ManuscriptNode } from '../schema/types'
import { NodeViewCreator } from '../types'
import Block from './block'

class TOCElement extends Block {
  private element: HTMLElement

  public update(newNode: ManuscriptNode) {
    if (newNode.attrs.id !== this.node.attrs.id) return false
    if (newNode.type.name !== this.node.type.name) return false
    this.node = newNode
    this.updateContents()
    return true
  }

  public stopEvent() {
    return true
  }

  public ignoreMutation() {
    return true
  }

  protected get elementType() {
    return 'div'
  }

  protected updateContents() {
    try {
      this.element.innerHTML = sanitize(this.node.attrs.contents)
    } catch (e) {
      console.error(e) // tslint:disable-line:no-console
      // TODO: improve the UI for presenting offline/import errors
      window.alert(
        'There was an error loading the HTML purifier, please reload to try again'
      )
    }
  }

  protected createElement() {
    this.element = document.createElement(this.elementType)
    this.element.className = 'block'
    this.element.setAttribute('id', this.node.attrs.id)
    this.dom.appendChild(this.element)
  }
}

const tocElement = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new TOCElement(props, node, view, getPos)

export default tocElement
