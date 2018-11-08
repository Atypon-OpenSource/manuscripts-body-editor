import { EditorProps } from '../components/Editor'
import { ManuscriptNode } from '../schema/types'
import { NodeViewCreator } from '../types'
import Block from './block'

class EquationElement extends Block {
  protected get elementType() {
    return 'figure'
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

const equationElement = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new EquationElement(props, node, view, getPos)

export default equationElement
