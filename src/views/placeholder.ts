import { NodeView } from 'prosemirror-view'
import { placeholderContent } from '../lib/placeholder'
import { ManuscriptNode } from '../schema/types'
import { NodeViewCreator } from '../types'

class Placeholder implements NodeView {
  public dom: HTMLElement
  private node: ManuscriptNode

  constructor(node: ManuscriptNode) {
    this.node = node

    this.initialise()
  }

  private initialise() {
    this.dom = document.createElement('div')
    this.dom.classList.add('placeholder-item')
    this.dom.innerHTML = placeholderContent(
      this.node.attrs.label,
      'support@manuscriptsapp.com'
    )
  }
}

const placeholder: NodeViewCreator = node => new Placeholder(node)

export default placeholder
