import { EditorProps } from '../components/Editor'
import { ManuscriptEditorView, ManuscriptNode } from '../schema/types'
import AbstractBlock from './abstract_block'

class Block extends AbstractBlock {
  public constructor(
    props: EditorProps,
    node: ManuscriptNode,
    view: ManuscriptEditorView,
    getPos: () => number
  ) {
    super(props, node, view, getPos)

    this.initialise()
  }
}

export default Block
