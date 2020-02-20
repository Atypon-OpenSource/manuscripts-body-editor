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
  FigureLayout,
  FigureStyle,
  Manuscript,
  Model,
  ObjectTypes,
  PageLayout,
  ParagraphStyle,
  TableStyle,
} from '@manuscripts/manuscripts-json-schema'
import { Plugin } from 'prosemirror-state'

const isParagraphStyle = hasObjectType<ParagraphStyle>(
  ObjectTypes.ParagraphStyle
)
const isFigureStyle = hasObjectType<FigureStyle>(ObjectTypes.FigureStyle)
const isTableStyle = hasObjectType<TableStyle>(ObjectTypes.TableStyle)
const isFigureLayout = hasObjectType<FigureLayout>(ObjectTypes.FigureLayout)

interface Props {
  getModel: <T extends Model>(id: string) => T | undefined
  manuscript: Manuscript
  modelMap: Map<string, Model>
}

export default (props: Props) => {
  const chooseDefaultFigureStyle = (): string | undefined => {
    for (const model of props.modelMap.values()) {
      if (isFigureStyle(model) && model.prototype === 'MPFigureStyle:default') {
        return model._id
      }
    }
  }

  const chooseDefaultFigureLayout = (): string | undefined => {
    for (const model of props.modelMap.values()) {
      if (
        isFigureLayout(model) &&
        model.prototype === 'MPFigureLayout:default'
      ) {
        return model._id
      }
    }
  }

  const chooseDefaultTableStyle = (): string | undefined => {
    for (const model of props.modelMap.values()) {
      if (isTableStyle(model) && model.prototype === 'MPTableStyle:default') {
        return model._id
      }
    }
  }

  const findParagraphStyleByPrototype = (id: string): string | undefined => {
    for (const model of props.modelMap.values()) {
      if (isParagraphStyle(model) && model.prototype === id) {
        return model._id
      }
    }
  }

  const chooseDefaultParagraphStyle = (
    node: ManuscriptNode
  ): string | undefined => {
    switch (node.type) {
      case node.type.schema.nodes.toc_element:
        return findParagraphStyleByPrototype('MPParagraphStyle:toc')

      case node.type.schema.nodes.keywords_element:
        return findParagraphStyleByPrototype('MPParagraphStyle:keywords')

      case node.type.schema.nodes.bibliography_element:
        return findParagraphStyleByPrototype('MPParagraphStyle:bibliography')

      default:
        if (!props.manuscript.pageLayout) {
          return undefined
        }

        const pageLayout = props.getModel<PageLayout>(
          props.manuscript.pageLayout
        )

        if (!pageLayout) {
          return undefined
        }

        return pageLayout.defaultParagraphStyle
    }
  }

  return new Plugin<{}, ManuscriptSchema>({
    appendTransaction: (transactions, oldState, newState) => {
      // get the transaction from the new state
      const tr = newState.tr

      // only scan if nodes have changed
      if (!transactions.some(transaction => transaction.docChanged)) return null

      const { nodes } = newState.schema

      const nodesNeedingStyle: Array<{
        node: ManuscriptNode
        pos: number
        attrs: { [key: string]: string }
      }> = []

      // tslint:disable-next-line:cyclomatic-complexity
      newState.doc.descendants((node, pos, parent) => {
        // don't descend into elements
        if (parent.type !== nodes.manuscript && parent.type !== nodes.section) {
          return false
        }

        if ('paragraphStyle' in node.attrs && !node.attrs.paragraphStyle) {
          const paragraphStyle = chooseDefaultParagraphStyle(node)

          if (paragraphStyle) {
            nodesNeedingStyle.push({ node, pos, attrs: { paragraphStyle } })
          }
        }

        if ('figureStyle' in node.attrs && !node.attrs.figureStyle) {
          const figureStyle = chooseDefaultFigureStyle()

          if (figureStyle) {
            nodesNeedingStyle.push({ node, pos, attrs: { figureStyle } })
          }
        }

        if ('figureLayout' in node.attrs && !node.attrs.figureLayout) {
          const figureLayout = chooseDefaultFigureLayout()

          if (figureLayout) {
            nodesNeedingStyle.push({ node, pos, attrs: { figureLayout } })
          }
        }

        if ('tableStyle' in node.attrs && !node.attrs.tableStyle) {
          const tableStyle = chooseDefaultTableStyle()

          if (tableStyle) {
            nodesNeedingStyle.push({ node, pos, attrs: { tableStyle } })
          }
        }
      })

      if (nodesNeedingStyle.length) {
        for (const { node, pos, attrs } of nodesNeedingStyle) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            ...attrs,
          })
        }

        return tr.setSelection(newState.selection.map(tr.doc, tr.mapping))
      }
    },
  })
}
