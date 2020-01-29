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
  hasObjectType,
  ManuscriptNode,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import {
  BorderStyle,
  FigureStyle,
  Manuscript,
  Model,
  ObjectTypes,
  PageLayout,
  ParagraphStyle,
  TableStyle,
} from '@manuscripts/manuscripts-json-schema'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

const isParagraphStyle = hasObjectType<ParagraphStyle>(
  ObjectTypes.ParagraphStyle
)
const isTableStyle = hasObjectType<TableStyle>(ObjectTypes.TableStyle)

interface Props {
  getModel: <T extends Model>(id: string) => T | undefined
  manuscript: Manuscript
  modelMap: Map<string, Model>
}

export default (props: Props) => {
  const findDefaultTableStyle = (): TableStyle | undefined => {
    for (const model of props.modelMap.values()) {
      if (isTableStyle(model) && model.prototype === 'MPTableStyle:default') {
        return model
      }
    }
  }

  const findDefaultParagraphStyle = (
    prototype: string
  ): ParagraphStyle | undefined => {
    for (const model of props.modelMap.values()) {
      if (isParagraphStyle(model) && model.prototype === prototype) {
        return model
      }
    }
  }

  const defaultTableStyle = findDefaultTableStyle()

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

      let updated = false

      // add paragraphStyle where needed

      const nodesNeedingParagraphStyle: Array<{
        node: ManuscriptNode
        pos: number
      }> = []

      newState.doc.descendants((node, pos) => {
        if (!('paragraphStyle' in node.attrs)) {
          return true
        }

        if (!node.attrs.paragraphStyle) {
          nodesNeedingParagraphStyle.push({ node, pos })
        }

        // don't descend into lists
        if (listNodeTypes.includes(node.type)) {
          return false
        }
      })

      if (nodesNeedingParagraphStyle.length) {
        if (props.manuscript.pageLayout) {
          const pageLayout = props.getModel<PageLayout>(
            props.manuscript.pageLayout
          )

          if (pageLayout) {
            const chooseParagraphStyle = (
              node: ManuscriptNode
            ): string | undefined => {
              const { nodes } = node.type.schema

              const styleMap = new Map([
                [nodes.toc_element, 'MPParagraphStyle:toc'],
                [nodes.keywords_element, 'MPParagraphStyle:keywords'],
                [nodes.bibliography_element, 'MPParagraphStyle:bibliography'],
              ])

              const prototype = styleMap.get(node.type)

              if (prototype) {
                const defaultStyle = findDefaultParagraphStyle(prototype)

                return defaultStyle ? defaultStyle._id : undefined
              }

              return pageLayout.defaultParagraphStyle
            }

            for (const { node, pos } of nodesNeedingParagraphStyle) {
              const paragraphStyle = chooseParagraphStyle(node)

              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                paragraphStyle,
              })
            }

            updated = true
          }
        }
      }

      // add default tableStyle where needed
      if (defaultTableStyle) {
        newState.doc.descendants((node, pos) => {
          if ('tableStyle' in node.attrs && !node.attrs.tableStyle) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              tableStyle: defaultTableStyle._id,
            })

            updated = true
          }
        })
      }

      //  return the transaction if something changed
      if (updated) {
        return tr.setSelection(newState.selection.map(tr.doc, tr.mapping))
      }
    },
  })
}
