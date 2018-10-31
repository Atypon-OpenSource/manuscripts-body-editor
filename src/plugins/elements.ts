import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { ManuscriptSchema } from '../schema/types'

export default () => {
  return new Plugin<ManuscriptSchema>({
    props: {
      decorations: state => {
        const decorations: Decoration[] = []

        // TODO: only calculate these when something changes

        state.doc.descendants((node, pos, parent) => {
          if (
            parent.type === state.schema.nodes.section &&
            node.type !== state.schema.nodes.section
          ) {
            decorations.push(
              Decoration.node(
                pos,
                pos + node.nodeSize,
                {},
                {
                  element: true,
                }
              )
            )
          }
        })

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
}
