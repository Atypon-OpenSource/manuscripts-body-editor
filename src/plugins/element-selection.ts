/*!
 * © 2026 Atypon Systems LLC
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
import { schema } from '@manuscripts/transform'
import { Node, ResolvedPos } from 'prosemirror-model'
import {
  EditorState,
  Plugin,
  PluginKey,
  TextSelection,
} from 'prosemirror-state'
import { CellSelection, selectedRect } from 'prosemirror-tables'
import {
  findParentNodeClosestToPos,
  findParentNodeOfTypeClosestToPos,
} from 'prosemirror-utils'
import { Decoration, DecorationSet } from 'prosemirror-view'

/** That is a normal text selection but hold locations of a block nodes to use that location for adding
 *  decoration that indicates text selection moves to the entire node */
class AnchorNodeWithTextSelection extends TextSelection {
  anchorNodePosition: { from: number; to: number }
  headNodePosition: { from: number; to: number }
  static create(doc: Node, anchor: number, head: number) {
    return new this(doc.resolve(anchor), doc.resolve(head))
  }
}

const key = new PluginKey<DecorationSet>('block-selection')

/**
 * This plugin update text selection to include full node with selection range.
 * we did that to prevent partial text selection between the children of elements nodes like(figure_element, table_element)
 * to protect there structural integrity from cut/delete. example of that figure_element with multiple images we need to
 * keep always a one image in that figure_element or delete the entire node if we don't need that image at all,
 * same will be for box_element we need to prevent the deletion of the main section node.
 */
export default () =>
  new Plugin({
    key,
    state: {
      init: () => undefined,
      apply: (_, decoration) => {
        return decoration
      },
    },
    appendTransaction: (_, oldState, newState) => {
      if (
        isTableShapeSelected(newState) &&
        !oldState.selection.eq(newState.selection)
      ) {
        const contentNode = findParentNodeOfTypeClosestToPos(
          newState.selection.$from,
          schema.nodes.table_element
        )
        if (contentNode) {
          const newTr = newState.tr
          const selection = AnchorNodeWithTextSelection.create(
            newState.doc,
            contentNode.pos,
            contentNode.pos + contentNode.node.nodeSize
          )
          selection.anchorNodePosition.from = contentNode.pos
          selection.anchorNodePosition.to =
            contentNode.pos + contentNode.node.nodeSize
          newTr.setSelection(selection)
          return newTr
        }
      }
    },
    props: {
      handleDOMEvents: {
        mouseup: (view) => {
          if (view.state.selection instanceof AnchorNodeWithTextSelection) {
            view.dispatch(
              view.state.tr.setSelection(
                TextSelection.create(
                  view.state.doc,
                  view.state.selection.from,
                  view.state.selection.to
                )
              )
            )
          }
        },
      },
      decorations: (state) => {
        if (state.selection instanceof AnchorNodeWithTextSelection) {
          if (key.getState(state)) {
            return key.getState(state)
          }
          return DecorationSet.create(state.doc, [
            Decoration.node(
              state.selection.anchorNodePosition.from,
              state.selection.anchorNodePosition.to,
              {
                class: 'selected-block-node',
              }
            ),
          ])
        }
      },
      createSelectionBetween: (view, anchor, head) => {
        if (key.getState(view.state)) {
          return view.state.selection
        }
        if (anchor.pos === head.pos) {
          return null
        }
        const selectionAtTheNode =
          anchor.depth === head.depth &&
          anchor.sharedDepth(head.pos) === anchor.depth

        if (selectionAtTheNode) {
          return null
        }

        const anchorParent = findParentNodeClosestToPos(
          anchor,
          getSelectableNode(anchor)
        )
        const headParent = findParentNodeClosestToPos(
          head,
          getSelectableNode(head)
        )

        const isScrollDown = anchor.pos < head.pos
        let selection = null

        if (headParent) {
          if (anchorParent) {
            if (isScrollDown) {
              selection = AnchorNodeWithTextSelection.create(
                view.state.doc,
                anchorParent.pos,
                headParent.pos + headParent.node.nodeSize
              )
            } else {
              selection = AnchorNodeWithTextSelection.create(
                view.state.doc,
                headParent.pos,
                anchorParent.pos + anchorParent.node.nodeSize
              )
            }
            selection.anchorNodePosition.from = anchorParent.pos
            selection.anchorNodePosition.to =
              anchorParent.pos + anchorParent.node.nodeSize
            selection.headNodePosition.from = headParent.pos
            selection.headNodePosition.to =
              headParent.pos + headParent.node.nodeSize
            return selection
          }

          if (isScrollDown) {
            selection = AnchorNodeWithTextSelection.create(
              view.state.doc,
              anchor.pos,
              headParent.pos + headParent.node.nodeSize
            )
          }
          selection = AnchorNodeWithTextSelection.create(
            view.state.doc,
            headParent.pos,
            anchor.pos
          )
          selection.headNodePosition.from = headParent.pos
          selection.headNodePosition.to =
            headParent.pos + headParent.node.nodeSize
          return selection
        }

        if (anchorParent) {
          if (isScrollDown) {
            selection = AnchorNodeWithTextSelection.create(
              view.state.doc,
              anchorParent.pos,
              head.pos
            )
          }
          selection = AnchorNodeWithTextSelection.create(
            view.state.doc,
            head.pos,
            anchorParent.pos + anchorParent.node.nodeSize
          )
          selection.anchorNodePosition.from = anchorParent.pos
          selection.anchorNodePosition.to =
            anchorParent.pos + anchorParent.node.nodeSize
        }

        return selection
      },
    },
  })

const isTableShapeSelected = (state: EditorState) => {
  if (state.selection instanceof CellSelection) {
    const rect = selectedRect(state)
    return (
      rect.left === 0 &&
      rect.top === 0 &&
      rect.right === rect.map.width &&
      rect.bottom === rect.map.height
    )
  }
  return false
}

const getSelectableNode = ($pos: ResolvedPos) => (node: Node) => {
  if (node.type === schema.nodes.box_element) {
    // boxed element will be selectable only if the selection was part of its direct children
    return $pos.node($pos.depth - 1).type === schema.nodes.box_element
  }
  return (
    node.type.isInGroup('element') &&
    node.type !== schema.nodes.paragraph &&
    node.type !== schema.nodes.bibliography_element &&
    node.type !== schema.nodes.keywords_element &&
    node.type !== schema.nodes.footnotes_element
  )
}
