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

/**
 * A TextSelection that tracks both the text range and the containing block node boundaries.
 * Used for decorating the expanded selection visually.
 */
class ExpandedTextSelection extends TextSelection {
  anchorNodeFrom: number
  anchorNodeTo: number
  headNodeFrom: number
  headNodeTo: number

  static create(doc: Node, anchor: number, head: number) {
    return new this(doc.resolve(anchor), doc.resolve(head))
  }
}

const key = new PluginKey<DecorationSet>('expanded-text-selection')

/**
 * Expands text selections to whole element boundaries to prevent structural corruption.
 *
 * This plugin intercepts selections that span structural elements (table_element,
 * figure_element, box_element) and expands them to include full node boundaries.
 * This prevents partial deletions that would break required element structures.
 *
 * During selection (mouse drag):
 * - The native DOM selection shows only the text range under the cursor
 * - A decoration visually highlights the full expanded element boundaries
 * - This provides immediate visual feedback of what will actually be selected
 *
 * On mouseup:
 * - The selection is converted to a standard TextSelection with the expanded range
 * - The native DOM selection now matches the full expanded boundaries
 *
 * This two-phase approach ensures users see exactly what will be selected before
 * committing the selection, preventing accidental structural damage to the document.
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
          const selection = ExpandedTextSelection.create(
            newState.doc,
            contentNode.pos,
            contentNode.pos + contentNode.node.nodeSize
          )
          selection.anchorNodeFrom = contentNode.pos
          selection.anchorNodeTo = contentNode.pos + contentNode.node.nodeSize
          newTr.setSelection(selection)
          return newTr
        }
      }
    },
    props: {
      handleDOMEvents: {
        mouseup: (view) => {
          if (view.state.selection instanceof ExpandedTextSelection) {
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
        if (state.selection instanceof ExpandedTextSelection) {
          if (key.getState(state)) {
            return key.getState(state)
          }
          const decorations = []
          if (state.selection.anchorNodeFrom && state.selection.anchorNodeTo) {
            decorations.push(
              Decoration.node(
                state.selection.anchorNodeFrom,
                state.selection.anchorNodeTo,
                {
                  class: 'selected-block-node',
                }
              )
            )
          }
          if (state.selection.headNodeFrom && state.selection.headNodeTo) {
            decorations.push(
              Decoration.node(
                state.selection.headNodeFrom,
                state.selection.headNodeTo,
                {
                  class: 'selected-block-node',
                }
              )
            )
          }
          return decorations.length > 0
            ? DecorationSet.create(state.doc, decorations)
            : null
        }
      },
      createSelectionBetween: (view, $anchor, $head) => {
        // will keep using the same custom selection as it select entire node
        if (key.getState(view.state)) {
          return view.state.selection
        }
        if ($anchor.pos === $head.pos) {
          return null
        }
        const selectionAtTheNodeBoundary =
          $anchor.depth === $head.depth &&
          $anchor.sharedDepth($head.pos) === $anchor.depth
        if (selectionAtTheNodeBoundary) {
          return null
        }

        const anchorParent = findParentNodeClosestToPos(
          $anchor,
          getSelectableNode($anchor)
        )
        const headParent = findParentNodeClosestToPos(
          $head,
          getSelectableNode($head)
        )

        const isScrollDown = $anchor.pos < $head.pos
        const doc = view.state.doc

        if (anchorParent && headParent) {
          const selection = isScrollDown
            ? ExpandedTextSelection.create(
                doc,
                anchorParent.pos,
                headParent.pos + headParent.node.nodeSize
              )
            : ExpandedTextSelection.create(
                doc,
                headParent.pos,
                anchorParent.pos + anchorParent.node.nodeSize
              )
          selection.anchorNodeFrom = anchorParent.pos
          selection.anchorNodeFrom =
            anchorParent.pos + anchorParent.node.nodeSize
          selection.headNodeFrom = headParent.pos
          selection.headNodeTo = headParent.pos + headParent.node.nodeSize
          return selection
        }

        if (anchorParent) {
          const selection = isScrollDown
            ? ExpandedTextSelection.create(doc, anchorParent.pos, $head.pos)
            : ExpandedTextSelection.create(
                doc,
                $head.pos,
                anchorParent.pos + anchorParent.node.nodeSize
              )
          selection.anchorNodeFrom = anchorParent.pos
          selection.anchorNodeTo = anchorParent.pos + anchorParent.node.nodeSize

          return selection
        }

        if (headParent) {
          const selection = isScrollDown
            ? ExpandedTextSelection.create(
                doc,
                $anchor.pos,
                headParent.pos + headParent.node.nodeSize
              )
            : ExpandedTextSelection.create(doc, headParent.pos, $anchor.pos)
          selection.headNodeFrom = headParent.pos
          selection.headNodeTo = headParent.pos + headParent.node.nodeSize
          return selection
        }

        return null
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
    return (
      $pos.depth > 0 &&
      $pos.node($pos.depth - 1).type === schema.nodes.box_element
    )
  }
  return (
    node.type.isInGroup('element') &&
    node.type !== schema.nodes.paragraph &&
    node.type !== schema.nodes.bibliography_element &&
    node.type !== schema.nodes.keywords_element &&
    node.type !== schema.nodes.footnotes_element
  )
}
