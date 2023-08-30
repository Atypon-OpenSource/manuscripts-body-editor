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
import {
  ManuscriptEditorState,
  ManuscriptEditorView,
  schema,
} from '@manuscripts/transform'
import { wrapInList } from 'prosemirror-schema-list'
import { EditorState, Transaction } from 'prosemirror-state'
import React, { useCallback, useMemo } from 'react'

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
  const disabled = useMemo(() => enable && !enable(state), [state.selection]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateListType = useCallback(
    (type) => {
      if (!dispatch) {
        return
      }
      wrapInList(schema.nodes.ordered_list, { listStyleType: type })(
        state,
        dispatch
      )
      view && view.focus()
    },
    [dispatch, state, view]
  )

  return (
    <ToolbarItem>
      <ListButton
        title={title}
        data-active={active && active(state)}
        disabled={disabled}
        onMouseDown={(event) => {
          event.preventDefault()
          run(state, dispatch)
          view && view.focus()
        }}
      >
        <OrderedList />
      </ListButton>
      <ListStyleSelector
        disabled={disabled}
        updateListType={updateListType}
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
