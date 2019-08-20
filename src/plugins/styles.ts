/*!
 * © 2019 Atypon Systems LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  ManuscriptNode,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import {
  BorderStyle,
  FigureStyle,
  Manuscript,
  Model,
  PageLayout,
} from '@manuscripts/manuscripts-json-schema'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

interface Props {
  getModel: <T extends Model>(id: string) => T | undefined
  manuscript: Manuscript
}

export default (props: Props) => {
  const findBorderStyle = (item: FigureStyle) => {
    const defaultStyle: Partial<BorderStyle> = {
      doubleLines: false,
    }

    if (!item.innerBorder.style) return defaultStyle

    const style = props.getModel<BorderStyle>(item.innerBorder.style)

    return style || defaultStyle
  }

  // TODO: handle missing components?
  // TODO: subscribe to the db directly and use styled-components?
  // TODO: use context to subscribe a "subscribeToComponent" method?
  const styleString = (id: string) => {
    const item = props.getModel<FigureStyle>(id)

    // TODO: handle missing objects?
    // https://gitlab.com/mpapp-private/manuscripts-frontend/issues/395
    if (!item) return ''

    // TODO: bundled objects need to be available here
    const borderStyle = findBorderStyle(item)

    const styles = [
      ['border-color', item.innerBorder.color], // TODO: need bundled colors - this is an id
      ['border-width', item.innerBorder.width + 'px'],
      ['border-style', borderStyle.doubleLines ? 'double' : 'solid'],
    ]

    return styles.map(style => style.join(':')).join(';')
  }

  return new Plugin<{}, ManuscriptSchema>({
    props: {
      decorations: state => {
        const decorations: Decoration[] = []

        // TODO: generate decorations when state changes and just map them here?

        state.doc.descendants((node, pos) => {
          if (node.attrs.figureStyle) {
            decorations.push(
              Decoration.node(pos, pos + node.nodeSize, {
                style: styleString(node.attrs.figureStyle),
              })
            )
          }
        })

        return DecorationSet.create(state.doc, decorations)
      },
    },
    appendTransaction: (transactions, oldState, newState) => {
      // get the transaction from the new state
      const tr = newState.tr

      // only scan if nodes have changed
      if (!transactions.some(transaction => transaction.docChanged)) return null

      const { nodes } = newState.schema

      const listNodeTypes = [nodes.bullet_list, nodes.ordered_list]

      const nodesToUpdate: Array<{
        node: ManuscriptNode
        pos: number
      }> = []

      // for each node in the doc
      newState.doc.descendants((node, pos) => {
        if (!('paragraphStyle' in node.attrs)) {
          return true
        }

        if (!node.attrs.paragraphStyle) {
          nodesToUpdate.push({ node, pos })
        }

        // don't descend into lists
        if (listNodeTypes.includes(node.type)) {
          return false
        }
      })

      // update the nodes and return the transaction if something changed
      if (nodesToUpdate.length) {
        if (props.manuscript.pageLayout) {
          const pageLayout = props.getModel<PageLayout>(
            props.manuscript.pageLayout
          )

          if (pageLayout) {
            for (const { node, pos } of nodesToUpdate) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                paragraphStyle: pageLayout.defaultParagraphStyle,
              })
            }
          }

          return tr.setSelection(newState.selection.map(tr.doc, tr.mapping))
        }
      }
    },
  })
}
