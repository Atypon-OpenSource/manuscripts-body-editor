import { EditorProps } from '../components/Editor'
import { ManuscriptEditorView, ManuscriptNode } from '../schema/types'
import { NodeViewCreator } from '../types'
import Block from './block'

class ListingElement extends Block {
  protected get elementType() {
    return 'figure'
  }

  public constructor(
    props: EditorProps,
    node: ManuscriptNode,
    view: ManuscriptEditorView,
    getPos: () => number
  ) {
    super(props, node, view, getPos)

    this.initialise()
  }

  public update(newNode: ManuscriptNode) {
    if (newNode.type.name !== this.node.type.name) return false
    if (newNode.attrs.id !== this.node.attrs.id) return false
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
