import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { ManuscriptNode, ManuscriptSchema } from '../schema/types'

export default () =>
  new Plugin<ManuscriptSchema>({
    props: {
      decorations: state => {
        const decorations: Decoration[] = []

        const decorate = (node: ManuscriptNode, pos: number) => {
          const { placeholder } = node.attrs

          if (
            placeholder &&
            !node.isAtom &&
            node.type.isBlock &&
            node.childCount === 0
          ) {
            if (node.type === node.type.schema.nodes.paragraph) {
              const placeholderElement = document.createElement('span')
              placeholderElement.className = 'placeholder-text'
              placeholderElement.textContent = placeholder

              decorations.push(Decoration.widget(pos + 1, placeholderElement))
            } else {
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: 'empty-node',
                })
              )
            }
          }
        }

        state.doc.descendants(decorate)

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
