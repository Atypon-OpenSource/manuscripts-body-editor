import { sanitize } from 'dompurify'
import { Decoration } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { ManuscriptNode } from '../schema/types'
import { NodeViewCreator } from '../types'
import Block from './block'

class BibliographyElement extends Block {
  private element: HTMLElement

  public update(newNode: ManuscriptNode, decorations?: Decoration[]): boolean {
    if (newNode.attrs.id !== this.node.attrs.id) return false
    if (newNode.type.name !== this.node.type.name) return false
    this.handleDecorations(decorations)
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

const bibliographyElement = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new BibliographyElement(props, node, view, getPos)

export default bibliographyElement
