/*!
 * © 2023 Atypon Systems LLC
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
import OrderedList from '@manuscripts/assets/react/ToolbarIconOrderedList'
import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  ManuscriptEditorState,
  ManuscriptEditorView,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { NodeRange } from 'prosemirror-model'
import { wrapInList } from 'prosemirror-schema-list'
import { EditorState, Selection, Transaction } from 'prosemirror-state'
import React, { useCallback } from 'react'

import { skipTrackingChanges } from '../../keys/list'
import { ListButton, ListStyleSelector } from './ListStyleSelector'
import { ToolbarItem } from './ManuscriptToolbar'

export const OrderListSelector: React.FC<{
  state: ManuscriptEditorState
  dispatch: (tr: Transaction) => void
  view?: ManuscriptEditorView
  title: string
  active?: (state: EditorState) => boolean
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => void
  enable?: (state: EditorState) => boolean
}> = ({ state, dispatch, view, title, active, run, enable }) => {
  const isEnabled = !enable || enable(state)

  /**
   *  When choosing a list type will do one of these options:
   *  * if text is selected will wrap it with an order list
   *  * if the selection is on list will change just the list type and
   *    **in case it's nested list will change just the lists at the same level**
   */
  const onClickListType = useCallback(
    (type) => {
      if (!dispatch) {
        return
      }

      const { $from, $to } = state.selection
      const range = $from.blockRange($to)
      const isListNode =
        range &&
        schema.nodes.ordered_list.compatibleContent(
          $from.node(range.depth - 1).type
        )

      if (!isListNode) {
        skipTrackingChanges(
          wrapInList(schema.nodes.ordered_list, { listStyleType: type })
        )(state, dispatch)
        view && view.focus()
      } else {
        updateListStyle(state, dispatch, range, type)
      }
    },
    [dispatch, state, view]
  )

  return (
    <ToolbarItem>
      <ListButton
        title={title}
        data-active={active && active(state)}
        disabled={!isEnabled}
        onMouseDown={(event) => {
          event.preventDefault()
          run(state, dispatch)
          view && view.focus()
        }}
      >
        <OrderedList />
      </ListButton>
      <ListStyleSelector
        disabled={!isEnabled}
        onClickListType={onClickListType}
        list={[
          { items: ['1.', '2.', '3.'], type: 'order' },
          { items: ['A.', 'B.', 'C.'], type: 'alpha-upper' },
          { items: ['a.', 'b.', 'c.'], type: 'alpha-lower' },
          { items: ['I.', 'II.', 'III.'], type: 'roman-upper' },
          { items: ['i.', 'ii.', 'iii.'], type: 'roman-lower' },
        ]}
      />
    </ToolbarItem>
  )
}

/**
 *  Will use node depth as an indicator for the list level, and `sharedDepth` will
 *  give us all depths for the selection so we can find the parent list
 *  After that will look at the nodes in the parent list and just update
 *  the list that had the same level to the target level user has selected
 */
export const updateListStyle = (
  state: ManuscriptEditorState,
  dispatch: (tr: Transaction) => void,
  range: NodeRange,
  type: string
) => {
  const { $from } = state.selection
  const tr = state.tr
  const targetLevel = range.depth - 1
  const selectionDepth = $from.sharedDepth(state.selection.to)
  const parentListDepth =
    [...Array(selectionDepth)].findIndex((_, index) => {
      const node = $from.node(index + 1)
      return (
        node.type === schema.nodes.ordered_list ||
        node.type === schema.nodes.bullet_list
      )
    }) + 1
  const parentListNode = $from.node(parentListDepth)
  const parentListPos = $from.before(parentListDepth)

  if (parentListDepth === targetLevel) {
    replaceToOrderList(
      parentListPos,
      parentListPos + parentListNode.nodeSize,
      parentListNode
    )
  } else {
    parentListNode.descendants((node, pos) => {
      if (
        (node.type === schema.nodes.ordered_list ||
          node.type === schema.nodes.bullet_list) &&
        state.doc.resolve(parentListPos + pos + node.nodeSize).depth ===
          targetLevel
      ) {
        replaceToOrderList(
          parentListPos + pos,
          parentListPos + pos + node.nodeSize,
          node
        )
      }
    })
  }

  function replaceToOrderList(from: number, to: number, node: ManuscriptNode) {
    tr.replaceRangeWith(
      from,
      to,
      schema.nodes.ordered_list.create(
        {
          ...node.attrs,
          listStyleType: type,
        },
        node.content,
        node.marks
      )
    )
  }

  dispatch(
    skipTracking(tr).setSelection(Selection.near(tr.doc.resolve($from.pos)))
  )
}
