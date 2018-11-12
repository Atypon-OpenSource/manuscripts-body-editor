import { Decoration } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { ManuscriptNode } from '../schema/types'
import { NodeViewCreator } from '../types'
import Block from './block'

class ListingElement extends Block {
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

  protected updateContents() {
    const { suppressCaption } = this.node.attrs

    this.dom.classList.toggle('suppress-caption', suppressCaption)
  }
}

const listingElement = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new ListingElement(props, node, view, getPos)

export default listingElement
