import { EditorProps } from '../components/Editor'
import { NodeViewCreator } from '../types'
import Block from './block'

class BulletList extends Block {
  protected get elementType() {
    return 'ul'
  }
}

const bulletList = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos,
  decorations
) => {
  for (const decoration of decorations) {
    if (decoration.spec.element) {
      return new BulletList(props, node, view, getPos)
    }
  }

  const dom = document.createElement('ul')

  return {
    dom,
    contentDOM: dom,
  }
}

export default bulletList
