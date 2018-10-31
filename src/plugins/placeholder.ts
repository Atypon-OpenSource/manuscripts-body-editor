import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { ManuscriptNode, ManuscriptSchema } from '../schema/types'

export default () => {
  return new Plugin<ManuscriptSchema>({
    props: {
      decorations: state => {
        const decorations: Decoration[] = []

        const decorate = (node: ManuscriptNode, pos: number) => {
          if (!node.isAtom && node.type.isBlock && node.childCount === 0) {
            decorations.push(
              Decoration.node(pos, pos + node.nodeSize, {
                class: 'empty-node',
              })
            )
          }
        }

        state.doc.descendants(decorate)

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
}
